<?php
require 'config.php';

$currUser = $_SERVER['PHP_AUTH_USER'];
$linecount = 0;

if (isset($authorized[$currUser])) {
    foreach ($authorized[$currUser] as $realm) {
        $file = "drop_{$realm}.json";
        if (is_readable($file)) {
            // Fast line count using file() + count()
            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $linecount += count($lines);
        }
    }
}

echo $linecount;
