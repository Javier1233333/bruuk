// La app comparte el catálogo con la web (../src/data), así que Metro tiene que ver la raíz del repo.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [repoRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// El código compartido usa imports estilo NodeNext ('./archivo.js' apuntando a './archivo.ts').
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolve ?? context.resolveRequest;
  try {
    return resolve(context, moduleName, platform);
  } catch (error) {
    if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
      return resolve(context, moduleName.slice(0, -3), platform);
    }
    throw error;
  }
};

module.exports = config;
