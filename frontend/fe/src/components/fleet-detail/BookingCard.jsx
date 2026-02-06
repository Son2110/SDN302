const BookingCard = () => {
  return (
    <div className="sticky top-32 bg-white rounded-xl shadow-lg p-6 space-y-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Daily Rate</span>
        <span className="text-2xl font-bold">$200</span>
      </div>

      <div className="space-y-3">
        <input className="w-full border rounded px-3 py-2 text-sm" placeholder="Pickup Location" />
        <input type="date" className="w-full border rounded px-3 py-2 text-sm" />
        <input type="date" className="w-full border rounded px-3 py-2 text-sm" />

        <select className="w-full border rounded px-3 py-2 text-sm">
          <option>Self Drive</option>
          <option>Chauffeur</option>
        </select>
      </div>

      <div className="border-t pt-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span>Base Price</span>
          <span>$200</span>
        </div>
        <div className="flex justify-between">
          <span>Insurance</span>
          <span>$50</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>$250</span>
        </div>
      </div>

      <button className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700">
        BOOK THIS CAR
      </button>

      <div className="bg-gray-50 p-4 rounded text-xs text-gray-600">
        Need Assistance? <br />
        <span className="text-blue-600 cursor-pointer">Contact Concierge →</span>
      </div>
    </div>
  );
};

export default BookingCard;
