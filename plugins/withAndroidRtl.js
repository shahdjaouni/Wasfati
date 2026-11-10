const { withMainApplication } = require('@expo/config-plugins');

const IMPORT = 'import com.facebook.react.modules.i18nmanager.I18nUtil';
const MARKER = 'I18nUtil.instance.forceRTL(this, true)';

/**
 * Writes the RTL preference before React Native reads it.
 * SharedPreferences survive an update, and this runs on every process start,
 * so an upgrade is RTL on the first frame without a JS reload or a data wipe.
 */
function ensureAndroidRtl(contents) {
  if (contents.includes(MARKER)) return contents;
  if (!contents.includes('loadReactNative(this)')) {
    throw new Error('MainApplication is missing loadReactNative(this)');
  }

  let next = contents;
  if (!next.includes(IMPORT)) {
    const anchor = 'import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative';
    next = next.includes(anchor)
      ? next.replace(anchor, `${IMPORT}\n${anchor}`)
      : next.replace(/^(package .+\r?\n)/, `$1\n${IMPORT}\n`);
  }

  return next.replace(/([ \t]*)loadReactNative\(this\)/, (_match, indent) => {
    return `${indent}I18nUtil.instance.allowRTL(this, true)\n${indent}${MARKER}\n${indent}loadReactNative(this)`;
  });
}

function withAndroidRtl(config) {
  return withMainApplication(config, (config) => {
    config.modResults.contents = ensureAndroidRtl(config.modResults.contents);
    return config;
  });
}

module.exports = withAndroidRtl;
module.exports.ensureAndroidRtl = ensureAndroidRtl;
