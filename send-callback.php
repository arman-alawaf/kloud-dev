<?php

declare(strict_types=1);

/**
 * Site-root entry for the callback form. Many hosts / WAFs block or mishandle POST to /server/ paths.
 * Logic lives in server/send-callback.php (Composer, .env, mail).
 */
require __DIR__ . '/server/send-callback.php';
