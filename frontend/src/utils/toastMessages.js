import useToastStore from "../store/toastStore";

const AUTH_SUCCESS = {
  login: "Logged in successfully",
  register: "Registration successful",
  logout: "Logged out",
};

const STATUS_MESSAGES = {
  400: "Invalid credentials. Please try again.",
  401: "Session expired. Please log in again.",
  403: "You are not authorized to perform this action.",
  429: "Too many attempts. Please try again later.",
  500: "Server error. Please try again later.",
};

export function showToast(message, variant = "info") {
  useToastStore.getState().addToast(message, variant);
}

export function showAuthSuccessToast(action) {
  const message = AUTH_SUCCESS[action] || "Success";
  showToast(message, "success");
}

export function showAuthErrorToast(error, fallback = "Something went wrong") {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    (status ? STATUS_MESSAGES[status] : null) ||
    fallback;
  showToast(message, "error");
}