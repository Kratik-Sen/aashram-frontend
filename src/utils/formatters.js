export const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export const number = (value) => new Intl.NumberFormat("en-IN").format(Number(value || 0));

export const shortDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
};

export const getErrorMessage = (error) => error?.response?.data?.message || error?.message || "Something went wrong";
