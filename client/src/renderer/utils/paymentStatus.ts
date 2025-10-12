export interface PaymentStatus {
  status: "PAID" | "UNPAID" | "PARTIAL";
  totalPaid: number;
  remainingAmount: number;
  paymentBreakdown: Array<{ type: string; amount: number }>;
}

export const calculatePaymentStatus = (
  paymentType: string,
  totalAmount: number
): PaymentStatus => {
  if (!paymentType || paymentType.trim() === "") {
    return {
      status: "UNPAID",
      totalPaid: 0,
      remainingAmount: totalAmount,
      paymentBreakdown: [],
    };
  }

  const paymentBreakdown: Array<{ type: string; amount: number }> = [];
  let totalPaid = 0;

  try {
    const payments = paymentType.split(", ").map((payment) => {
      const [type, amount] = payment.split(":");
      const numericAmount = parseFloat(amount);

      if (isNaN(numericAmount)) {
        console.warn(`Invalid payment amount: ${amount}`);
        return { type: type.trim(), amount: 0 };
      }

      return { type: type.trim(), amount: numericAmount };
    });

    paymentBreakdown.push(...payments);
    totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  } catch (error) {
    console.error("Error parsing payment string:", paymentType, error);
    return {
      status: "UNPAID",
      totalPaid: 0,
      remainingAmount: totalAmount,
      paymentBreakdown: [],
    };
  }

  const remainingAmount = totalAmount - totalPaid;
  const tolerance = 0.01;

  let status: "PAID" | "UNPAID" | "PARTIAL";

  if (totalPaid <= 0) {
    status = "UNPAID";
  } else if (Math.abs(remainingAmount) <= tolerance) {
    status = "PAID";
  } else {
    status = "PARTIAL";
  }

  return {
    status,
    totalPaid,
    remainingAmount: Math.max(0, remainingAmount),
    paymentBreakdown,
  };
};

export const getPaymentStatusStyle = (
  status: "PAID" | "UNPAID" | "PARTIAL" | "PENDING"
) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800 border-green-200";
    case "PARTIAL":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "PENDING":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "UNPAID":
    default:
      return "bg-red-100 text-red-800 border-red-200";
  }
};
