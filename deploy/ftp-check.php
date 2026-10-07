<?php

// Checks the FTP account an upload would use, and changes nothing on the server.
//
//   php deploy/ftp-check.php
//
// It logs in over FTP with TLS and does the checks deploy/ftp-upload.sh does before its first upload: the
// document root does not hold another site, the app folder has its .env, and the site runs the right PHP.

require __DIR__.'/lib.php';

run_cpanel_script('ftp-upload.sh', ['--check'], root('deploy'), ftp_env());
