// Minimal service worker so the site can be installed on a phone's home screen.
// It does not cache API data: standings and results always come fresh from the server.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
