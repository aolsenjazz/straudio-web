const path = require('path')

module.exports = function (api) {
    api.cache(true);

    const presets = ["@react-ssr/express/babel"];
    const plugins = [["module-resolver",{"alias": {
    	"@Components": path.resolve("./straudio-shared/components"),
    	"@Hooks": path.resolve("./straudio-shared/hooks"),
    	"@Services": path.resolve("./straudio-shared/services"),
    	"@Root": path.resolve("./"),
        "@Player": path.resolve("./straudio-shared/player"),
    }}]];

    return {
        presets,
        plugins
    };
}