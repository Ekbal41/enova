const prisma = require("../db/prismaClient.js");
const { validate, validateAsync } = require("../../../../../index.js");
// Login-----------------------------------------------------------

function loginView(req, res) {
  const title = "Login";
  res.render("src/views/auth/login.html", { title, feedback: req.feedback });
}

async function loginHandler(req, res, { eAuth }) {
  const { email, password } = req.formData;

  const error = validate(req.formData, {
    password: {
      validator: (password) => password.length >= 4,
      message: "Password must be at least 6 characters long.",
    },
  });
  if (error) {
    res.directTo("/auth", error);
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (user) {
    const isPasswordValid = eAuth.verifyPassword(password, user.password);
    if (isPasswordValid) {
      eAuth.storeToken({
        payload: {
          email: user.email,
        },
        secret: "secret",
        expiresIn: 60 * 60 * 24 * 7,
      });
    } else {
      res.directTo("/auth", {
        error: "Wrong credentials.",
      });
      return;
    }
  }
  res.directTo("/", {
    success: "User logged in successfully.",
  });
}

// Register-----------------------------------------------------------
function registerView(req, res) {
  const title = "Register";
  res.render("src/views/auth/register.html", { title, feedback: req.feedback });
}

async function registerHandler(req, res, { eAuth }) {
  const { email, password, password2 } = req.formData;

  const error = await validateAsync(req.formData, {
    email: {
      validator: async (email) => {
        const emailRegistred = await prisma.user.findUnique({
          where: {
            email: email,
          },
        });
        if (emailRegistred) {
          return false;
        }
        return true;
      },
      message: "Email already registred.",
    },
    password: {
      validator: (password) => password.length >= 4,
      message: "Password must be at least 6 characters long.",
    },
  });
  if (error) {
    res.directTo("/auth/register", error);
    return;
  }
  if (password === password2) {
    await prisma.user.create({
      data: {
        email: email,
        password: eAuth.hashPassword(password),
        notes: {},
      },
    });
  } else {
    res.directTo("/auth/register", { error: "Passwords do not match." });
    return;
  }
  res.directTo("/auth", { success: "User registered successfully." });
}

// Logout-----------------------------------------------------------
function logoutHandler(req, res, { eAuth }) {
  eAuth.removeToken();
  res.directTo("/", { success: "User logged out successfully." });
}

module.exports = {
  loginHandler,
  loginView,
  registerView,
  registerHandler,
  logoutHandler,
};
