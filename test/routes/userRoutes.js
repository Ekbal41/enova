const userRoutes = [
  {
    pathname: "helloFromAis",
    method: "GET",
    path: "/",
    callback: (request, response) => {
      response.end("Hello from Ais");
    },
  },
  {
    pathname: "helloFromAis2",
    method: "GET",
    path: "/ais/:app",
    callback: (request, response) => {
      response.end(`Hello from Ais `);
    },
  },
];


module.exports = userRoutes;
