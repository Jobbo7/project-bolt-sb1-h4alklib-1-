const { getDefaultConfig } = require('expo/config');

const config = getDefaultConfig(__dirname);

// Force the compiler to completely blind itself to the web source and server folders
config.resolver.blacklistRE = /src\/.*/;
config.resolver.blockList = [
  /.*\/src\/.*/,
  /.*\/server\/.*/,
  /.*\/supabase\/.*/
];

module.exports = config;
