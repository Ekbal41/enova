const http = require("http");
const { cyan, red, magenta } = require("colorette");
const aisLogger = require("../plugins/aisLogger");
const aisParamsAndQueryParser = require("../plugins/aisParamsAndQueryParser");
const aisResponseSender = require("../plugins/aisResponseSender");
const aisCustomResponse = require("../plugins/aisCustomResponse");
const aisRegistersHandler = require("../plugins/aisRegistersHandler");
class Aiszo {
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.httpRequests = [];
    this.plugins = [];
    this.defaultPlugins();
    this.viewEngine = null;
    this.assetsFolder = null;
    this.onAssetsCallback = null;
  }
  /**
   * Register plugins to be used by the server.
   * @param {Array|object} plugins - An array or single plugin to register.
   */
  registerPlugins(plugins) {
    if (Array.isArray(plugins)) {
      this.plugins.push(...plugins);
    } else {
      this.plugins.push(plugins);
    }
  }
  /**
   * Register the default plugins.
   */
  defaultPlugins() {
    this.registerPlugins([
      {
        name: "aisLogger",
        body: aisLogger,
      },
      {
        name: "aisCustomResponse",
        body: aisCustomResponse,
      },
      {
        name: "aisRegistersHandler",
        body: aisRegistersHandler,
      },
      {
        name: "aisParamsAndQueryParser",
        body: aisParamsAndQueryParser,
      },
      {
        name: "aisResponseSender",
        body: aisResponseSender, // always leve this at the end
      },
    ]);
  }
  /**
   * Register a specific plugin by name.
   * @param {string} pluginName - The name of the plugin.
   * @param {object} plugin - The plugin object.
   */
  register(pluginName, plugin) {
    switch (pluginName) {
      case "viewEngine":
        this.registerViewEngine(plugin);
        break;
      case "assetsFolder":
        this.registerAssetsFolder(plugin);
        break;
      // Add cases for other plugins as needed
      default:
        throw new Error(`Unknown plugin name: ${pluginName}`);
    }
  }
  /**
   * Handle incoming HTTP requests.
   * @param {http.IncomingMessage} req - The incoming req object.
   * @param {http.ServerResponse} res - The server res object.
   */
  async handleRequest(req, res) {
    const ctx = {
      req,
      res,
      self: this,
      index: 0,
      aiszo: {},
      routeMatched: false,
      currentRoute: null,
      currentAssetsRoute: null,
    };
    for (const plugin of this.plugins) {
      try {
        await plugin.body(ctx);
      } catch (err) {
        console.log(`
        ${red("Error")} in scope of <${magenta(plugin.name)}> Plugin. ${err}
        `);
      }
    }
  }
  /**
   * Register a route with a callback function.
   * @param {string} pathname - The pathname of the route.
   * @param {string} method - The HTTP method of the route.
   * @param {string} path - The path of the route.
   * @param {function} callback - The callback function to be executed.
   */
  route(method, path, callback) {
    this.httpRequests.push({
      method,
      path,
      callback,
    });
  }
  /**
   * Register multiple routes with a common prefix.
   * @param {Array} routes - An array of route configurations.
   * @param {string} prefix - The common prefix for the routes.
   */
  registerRoutes(routes, prefix) {
    let prefixedPath;
    for (const route of routes) {
      const { method, path, callback } = route;
      prefixedPath = prefix ? (path === "/" ? prefix : prefix + path) : path;
      if (prefixedPath.charAt(0) !== "/") {
        prefixedPath = "/" + prefixedPath;
      }
      this.route(method, prefixedPath, callback);
    }
  }
  /**
   * Register the view engine plugin.
   * @param {object} plugin - The view engine plugin configuration.
   */
  registerViewEngine(plugin) {
    const { name, engine, config } = plugin;

    if (!name || !engine) {
      throw new Error(
        "Invalid view engine registration. Please provide a name and an engine."
      );
    }

    this.viewEngine = {
      name,
      engine,
      config,
    };
  }
  /**
   * Register the assets folder plugin.
   * @param {object} plugin - The assets folder plugin configuration.
   */
  registerAssetsFolder(plugin) {
    const { path } = plugin;

    if (!path) {
      throw new Error(
        "Invalid assets folder registration. Please provide a path."
      );
    }

    this.assetsFolder = path;
  }
  /**
   * Register a GET route with a callback function.
   * @param {string} pathname - The pathname of the route.
   * @param {string} path - The path of the route.
   * @param {function} callback - The callback function to be executed.
   */
  get(path, callback) {
    this.route("GET", path, callback);
  }
  /**
   * Start the server and listen on the specified port.
   * @param {number} port - The port number to listen on.
   */
  start(port) {
    this.server.listen(port, () => {
      console.log(
        `🦉 Server is running on ${cyan("http://localhost:")}${cyan(port)}.`
      );
    });
  }
}

module.exports = Aiszo;
