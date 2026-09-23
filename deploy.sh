#!/usr/bin/env bash
#
# Deploy the latest main branch to the droplet (grill.moiorder.com).
#
#   ./deploy.sh           pull, then rebuild only the parts that changed
#   ./deploy.sh --force   pull, then rebuild everything
#
# Called by hand over SSH, or by .github/workflows/deploy.yml on every push.
# Only touches this app: php8.4-fpm is reloaded (graceful) and only the
# grill-reverb Supervisor program is restarted.

set -euo pipefail

APP_DIR=/var/www/ayeyarwady-grill
BRANCH=main
REVERB_PROGRAM=grill-reverb
PHP_FPM_SERVICE=php8.4-fpm

# Everything lives inside main() so bash parses the whole script before
# running it — git pull below may replace this very file mid-deploy.
main() {
    local force=false
    [[ "${1:-}" == "--force" ]] && force=true

    # Never let two deploys run at once (e.g. two quick pushes).
    exec 9>/tmp/grill-deploy.lock
    flock -n 9 || { echo "Another deploy is already running — exiting."; exit 1; }

    cd "$APP_DIR"

    step "Pulling latest $BRANCH"
    local old new
    old=$(git rev-parse HEAD)
    git pull --ff-only origin "$BRANCH"
    new=$(git rev-parse HEAD)

    if [[ "$old" == "$new" && "$force" == false ]]; then
        echo "Already up to date ($(git log --oneline -1)). Nothing to do."
        exit 0
    fi

    local changed=""
    [[ "$old" != "$new" ]] && changed=$(git diff --name-only "$old" "$new")

    if $force || grep -q '^backend/' <<<"$changed"; then
        deploy_backend
    else
        echo "No backend changes — skipping backend."
    fi

    if $force || grep -q '^frontend/' <<<"$changed"; then
        deploy_frontend "$changed" "$force"
    else
        echo "No frontend changes — skipping frontend."
    fi

    step "Deployed $(git log --oneline -1)"
}

deploy_backend() {
    step "Backend: composer install"
    cd "$APP_DIR/backend"
    COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction

    step "Backend: migrate + cache"
    php artisan migrate --force
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    chown -R www-data:www-data storage bootstrap/cache

    step "Backend: reload PHP-FPM and restart Reverb"
    systemctl reload "$PHP_FPM_SERVICE"
    supervisorctl restart "$REVERB_PROGRAM"
    cd "$APP_DIR"
}

deploy_frontend() {
    local changed=$1 force=$2
    cd "$APP_DIR/frontend"

    if [[ "$force" == true || ! -d node_modules ]] || grep -q '^frontend/package-lock.json$' <<<"$changed"; then
        step "Frontend: npm ci"
        npm ci
    fi

    # Build into a separate folder and swap it in only if the build
    # succeeds, so a broken build never takes the live site down.
    step "Frontend: build"
    rm -rf dist-new
    npm run build -- --outDir dist-new --emptyOutDir

    rm -rf dist-old
    [[ -d dist ]] && mv dist dist-old
    mv dist-new dist
    rm -rf dist-old
    cd "$APP_DIR"
}

step() { printf '\n==> %s\n' "$*"; }

main "$@"
exit
