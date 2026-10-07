# The files of the document root that an upload script writes itself. Sourced by deploy/cpanel-upload.sh and
# deploy/ftp-upload.sh, which set TARGET_URL.

php_handler() { # php_handler: prints the PHP version block cPanel keeps in the .htaccess given on standard input
  sed -n '/^# php -- BEGIN cPanel-generated handler/,/^# php -- END cPanel-generated handler/p'
}

write_htaccess() { # write_htaccess <package.zip> <handler block, may be empty>: prints the site's .htaccess
  local host host_pattern
  host="${TARGET_URL#*://}"
  host_pattern="${host//./\\.}"
  # One address only: the login cookie belongs to a host, so two names would mean two separate logins, and
  # over plain HTTP the browser drops it. cPanel's own HTTPS redirect did not cover www.
  # cPanel checks the domain for its certificate through /.well-known, which must answer on every name.
  cat <<EOF
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} !=on [OR]
    RewriteCond %{HTTP_HOST} !^$host_pattern\$ [NC]
    RewriteCond %{REQUEST_URI} !^/\\.well-known/
    RewriteRule ^ $TARGET_URL%{REQUEST_URI} [L,R=301]
</IfModule>

EOF
  unzip -p "$1" public/.htaccess
  [ -z "$2" ] || printf '\n%s\n' "$2"
}
