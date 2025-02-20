process.env.NODE_ENV = "test";
const { sequelize } = require("../models/index");
const request = require("supertest");
const app = require("../index"); // Import your Express app

  test(" Should return 200 OK for GET /healthz", async () => {
    const response = await request(app).get("/healthz");
    expect(response.status).toBe(200);
  });

  test(" Should return 400 Bad Request if body is present in GET /healthz", async () => {
    const response = await request(app).get("/healthz").send({ key: "value" });

    expect(response.status).toBe(400);
  });

  const unsupportedMethods = ["post", "put", "delete", "patch"];

  unsupportedMethods.forEach((method) => {
    test(` Should return 405 Method Not Allowed for ${method.toUpperCase()} /healthz`, async () => {
      const response = await request(app)[method]("/healthz");
      expect(response.status).toBe(405);
    });
  });
});
