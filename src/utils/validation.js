import validator from "validator";

const loginValidator = (req) => {
  const ALLOWED_VALUES = ["username", "password"];
  const data = req.body;

  const areFieldsValid = Object.keys(data).every((value) =>
    ALLOWED_VALUES.includes(value)
  );

  if (!areFieldsValid) {
    throw new Error("Invalid form data");
  }

  if (!validator.isLength(data.username, { min: 3, max: 30 })) {
    throw new Error("Username length out of bounds");
  }
};

const signupValidator = (req) => {
  const ALLOWED_VALUES = ["name", "username", "password", "gender"];
  const allowedGenders = ["male", "female", "other"];
  const data = req.body;

  for (const key in data) {
    if (key !== "password" && typeof data[key] === "string") {
      data[key] = data[key].trim();
    }
  }

  for (const field of ALLOWED_VALUES) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }

  const areFieldsValid = Object.keys(data).every((value) =>
    ALLOWED_VALUES.includes(value)
  );

  if (!areFieldsValid) {
    throw new Error("Invalid form data");
  }

  if (!validator.isAlpha(data.name, "en-US", { ignore: " " })) {
    throw new Error("Name can only contain alphabets");
  }

  if (!validator.isLength(data.name, { min: 3, max: 30 })) {
    throw new Error("Name is either too short or too long");
  }

  if (!validator.isLength(data.username, { min: 4, max: 15 })) {
    throw new Error("Username is either too short or too long");
  }

  if (!allowedGenders.includes(data.gender.toLowerCase())) {
    throw new Error("Invalid gender");
  }

  if (!validator.isStrongPassword(data.password)) {
    throw new Error("Password is weak");
  }
};

export { loginValidator, signupValidator };
