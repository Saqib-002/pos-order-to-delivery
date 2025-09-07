import React from "react";
import { Order } from "@/types/order";

interface ViewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const ViewOrderModal: React.FC<ViewOrderModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen || !order) return null;

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = order.items.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "sent to kitchen":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready for delivery":
        return "bg-green-100 text-green-800 border-green-200";
      case "out for delivery":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "delivered":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Order Details</h2>
              <p className="text-blue-100 mt-1">
                Order #{order.orderId} • {order.status}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-500 transition-colors duration-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 cursor-pointer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-8">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Information
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Order ID:</span>
                    <p className="font-medium text-gray-900">
                      #{order.orderId}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ml-2 ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Created:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(order.createdAt || order.id).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Customer Details
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Name:</span>
                    <p className="font-medium text-gray-900">
                      {order.customer.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Phone:</span>
                    <p className="font-medium text-gray-900">
                      {order.customer.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Address:</span>
                    <p className="font-medium text-gray-900">
                      {order.customer.address}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Summary
                  </h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <p className="font-medium text-gray-900">{totalItems}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Total Price:</span>
                    <p className="font-medium text-gray-900">
                      ${totalPrice.toFixed(2)}
                    </p>
                  </div>
                  {order.deliveryPerson && (
                    <div>
                      <span className="text-sm text-gray-600">
                        Delivery Person:
                      </span>
                      <div className="mt-1">
                        <p className="font-medium text-gray-900">
                          {order.deliveryPerson.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.deliveryPerson.phone} •{" "}
                          {order.deliveryPerson.vehicleType}
                        </p>
                        {order.deliveryPerson.licenseNo && (
                          <p className="text-xs text-gray-400">
                            License: {order.deliveryPerson.licenseNo}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <svg
                    className="w-5 h-5 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Items
                </h3>
              </div>

              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-lg">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            Category: {item.category}
                          </span>
                          {item.price && (
                            <span className="text-sm text-gray-600">
                              Price: ${item.price}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          x{item.quantity}
                        </div>
                        {item.price && (
                          <div className="text-sm text-gray-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-600 mb-2">
                          Ingredients:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.ingredients.map((ingredient, ingIndex) => (
                            <span
                              key={ingIndex}
                              className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.specialInstructions && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-600 mb-1">
                          Special Instructions:
                        </div>
                        <p className="text-sm text-gray-900 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                          {item.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Items:</span>
                  <span className="text-blue-600">{totalItems}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold mt-2">
                  <span>Total Price:</span>
                  <span className="text-green-600">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 cursor-pointer hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
