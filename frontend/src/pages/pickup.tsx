// pages/pickup.tsx
import React, { useState, useRef, useEffect } from "react";
import * as echarts from "echarts";
import { useNavigate } from "react-router-dom";
import { createCollectionRequest } from "../services/api"; // Import the API function
import moment from "moment";

interface CategoryItems {
  [key: string]: SubCategory;
}
interface SubCategory {
  [key: string]: number;
}
interface Translations {
  [key: string]: string;
}
interface AddressState {
  street: string;
  apartment: string;
  city: string;
  pinCode: string;
}
interface ContactState {
  fullName: string;
  phone: string;
  email: string;
}
const App: React.FC = () => {
  const [language, setLanguage] = useState<"en" | "gu">("en");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const navigate = useNavigate();
  const [pickupError, setPickupError] = useState<string>("");
  // Translations
  const translations: { [key: string]: Translations } = {
    en: {
      schedulePickup: "Schedule E-Waste Pickup",
      myProfile: "My Profile",
      pickupHistory: "Pickup History",
      greenPoints: "Green Points Balance",
      settings: "Settings",
      logout: "Logout",
      contactInfo: "Contact Information",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      emailAddress: "Email Address",
      pickupSchedule: "Pickup Schedule",
      preferredDate: "Preferred Date",
      preferredTime: "Preferred Time Slot",
      selectTimeSlot: "Select a time slot",
      eWasteItems: "E-Waste Items",
      items: "items",
      pickupLocation: "Pickup Location",
      streetAddress: "Street Address",
      apartmentSuite: "Apartment/Suite",
      city: "City",
      pinCode: "PIN Code",
      pickupSummary: "Pickup Summary",
      totalItems: "Total Items",
      greenPointsEarn: "Green Points to Earn",
      points: "points",
      pickupDate: "Pickup Date",
      timeSlot: "Time Slot",
      notSelected: "Not selected",
      scheduleButton: "Schedule Pickup",
      enterStreetAddress: "Enter your street address",
      enterApartment: "Enter apartment or suite number",
      enterCity: "Enter city name",
      enterPinCode: "Enter PIN code",
    },
    gu: {
      schedulePickup: "ઇ-વેસ્ટ પિકઅપ શેડ્યૂલ કરો",
      myProfile: "મારી પ્રોફાઇલ",
      pickupHistory: "પિકઅપ ઇતિહાસ",
      greenPoints: "ગ્રીન પોઈન્ટ્સ બેલેન્સ",
      settings: "સેટિંગ્સ",
      logout: "લૉગ આઉટ",
      contactInfo: "સંપર્ક માહિતી",
      fullName: "પૂરું નામ",
      phoneNumber: "ફોન નંબર",
      emailAddress: "ઇમેઇલ એડ્રેસ",
      pickupSchedule: "પસંદગીની તારીખ",
      preferredTime: "પસંદગીનો સમય સ્લોટ",
      selectTimeSlot: "સમય સ્લોટ પસંદ કરો",
      eWasteItems: "ઇ-વેસ્ટ આઇટમ્સ",
      items: "આઇટમ્સ",
      pickupLocation: "પિકઅપ લોકેશન",
      streetAddress: "સ્ટ્રીટ એડ્રેસ",
      apartmentSuite: "એપાર્ટમેન્ટ/સુઇટ",
      city: "શહેર",
      pinCode: "પિન કોડ",
      pickupSummary: "પિકઅપ સમરી",
      totalItems: "કુલ આઇટમ્સ",
      greenPointsEarn: "મેળવવાના ગ્રીન પોઈન્ટ્સ",
      points: "પોઈન્ટ્સ",
      pickupDate: "પિકઅપ તારીખ",
      timeSlot: "સમય સ્લોટ",
      notSelected: "પસંદ કરેલ નથી",
      scheduleButton: "પિકઅપ શેડ્યૂલ કરો",
      enterStreetAddress: "તમારું સ્ટ્રીટ એડ્રેસ દાખલ કરો",
      enterApartment: "એપાર્ટમેન્ટ અથવા સુઇટ નંબર દાખલ કરો",
      enterCity: "શહેરનું નામ દાખલ કરો",
      enterPinCode: "પિન કોડ દાખલ કરો",
    },
  };
  // State for E-Waste Items
  const [selectedItems, setSelectedItems] = useState<CategoryItems>({
    "Household Electronics": {
      "Television Sets": 0,
      "Mobile Phones": 0,
      Radios: 0,
      "DVD/CD Players": 0,
      "Basic Computing Devices": 0,
      "Remote Controls": 0,
    },
    "Household Appliances": {
      Refrigerators: 0,
      "Washing Machines": 0,
      "Electric Stoves": 0,
      Microwaves: 0,
      "Fans and Air Coolers": 0,
      "Small Kitchen Appliances": 0,
    },
    "Lighting and Power Equipment": {
      "LED and Fluorescent Lamps": 0,
      Batteries: 0,
      "Power Tools": 0,
      "Inverters and Stabilizers": 0,
      "Solar Panels": 0,
      "Extension Cords": 0,
    },
    "Agricultural and Small Business Electronics": {
      "Water Pumps and Motors": 0,
      "Electronic Weighing Scales": 0,
      "Point-of-Sale Devices": 0,
      "Communication Equipment": 0,
      "Small Machinery": 0,
      "Testing Equipment": 0,
    },
    "Communication and Connectivity Devices": {
      "Feature Phones": 0,
      "Old Telephone Equipment": 0,
      "Satellite Dish Components": 0,
      Routers: 0,
      "Cables and Wires": 0,
      "Radio Equipment": 0,
    },
  });
  // State for Total Points
  const [totalPoints, setTotalPoints] = useState<number>(0);
  // State for Address
  const [address, setAddress] = useState<AddressState>({
    street: "",
    apartment: "",
    city: "",
    pinCode: "",
  });
  // State for Contact Information
  const [contact, setContact] = useState<ContactState>({
    fullName: "",
    phone: "",
    email: "",
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  // Update Echarts
  useEffect(() => {
    if (mapRef.current) {
      const chart = echarts.init(mapRef.current);
      const option = {
        animation: false,
        bmap: {
          center: [72.5714, 23.0225],
          zoom: 12,
          roam: true,
        },
        series: [
          {
            type: "scatter",
            coordinateSystem: "bmap",
            data: [[72.5714, 23.0225]],
          },
        ],
      };
      chart.setOption(option);
    }
  }, []);
  // Update Total Points When Selected Items Change
  useEffect(() => {
    const pointsPerItem: { [key: string]: number } = {
      "Household Electronics": 30,
      "Household Appliances": 50,
      "Lighting and Power Equipment": 25,
      "Agricultural and Small Business Electronics": 40,
      "Communication and Connectivity Devices": 20,
    };
    const points = Object.entries(selectedItems).reduce(
      (acc, [category, subItems]) => {
        const categoryPoints = Object.values(subItems).reduce(
          (subAcc, quantity) => {
            return subAcc + quantity * (pointsPerItem[category] || 0);
          },
          0
        );
        return acc + categoryPoints;
      },
      0
    );
    setTotalPoints(points);
  }, [selectedItems]);
  const timeSlots: string[] = [
    "09:00 AM - 11:00 AM",
    "11:00 AM - 01:00 PM",
    "02:00 PM - 04:00 PM",
    "04:00 PM - 06:00 PM",
  ];
  const t: Translations = translations[language];
  // Schedule pickup after form is good
  const handleSubmit = async () => {
    // Reset error
    setPickupError("");
    try {
      // Validate date and time selection
      if (!selectedDate || !selectedTime) {
        setPickupError("Please select a date and time.");
        return; // Stop the submission
      }

      // Transform selectedItems to match backend expectation
      let ewasteItems = [];
      for (const category in selectedItems) {
        for (const subCategory in selectedItems[category]) {
          const quantity = selectedItems[category][subCategory];
          if (quantity > 0) {
            //  Now ewasteItems is quantity number of items instead of object
            for (let i = 0; i < quantity; i++) {
              ewasteItems.push({
                ewasteType: category,
                ewasteSubtype: subCategory,
              });
            }
          }
        }
      }

      // Don't call back end if not has 1 items.
      if (ewasteItems.length === 0) {
        setPickupError("Please select at least one e-waste item.");
        return; // Don't send the request if no items are selected
      }

      // Validate other input before send the data to server,
      if (
        !contact.email ||
        !contact.fullName ||
        !contact.phone ||
        !address.apartment ||
        !address.city ||
        !address.street ||
        !address.pinCode
      ) {
        setPickupError("Please fill all form to schedule. .");
        return;
      }

      // Parse time slot to extract start time (e.g., "09:00 AM")
      const timePart = selectedTime.split(" ")[0];

      // Create preferredDateTime string in ISO 8601 format
      const preferredDateTime = moment(
        selectedDate + " " + timePart,
        "YYYY-MM-DD hh:mm A"
      ).toISOString();

      console.log("Formatted preferredDateTime:", preferredDateTime);

      // **Make individual requests for each e-waste item**
      for (const item of ewasteItems) {
        const requestData = {
          fullName: contact.fullName,
          phoneNumber: contact.phone,
          streetAddress: address.street,
          city: address.city,
          zipCode: address.pinCode,
          preferredDateTime: preferredDateTime,
          ewasteType: item.ewasteType, // Send individual item details
          ewasteSubtype: item.ewasteSubtype,
          quantity: 1, //  Hardcode to 1, since it represents 1 item now.
        };

        try {
          // Send request to backend
          const response = await createCollectionRequest(requestData); // Use the API function
          console.log("Pickup scheduled successfully:", response.data);
        } catch (error: any) {
          console.error("Error scheduling pickup:", error);
          setPickupError(
            error.response?.data?.message ||
              "Failed to schedule pickup. Please try again."
          );
          return; // Stop if any request fails
        }
      }

      alert("Pickup scheduled successfully!");
      navigate("/"); // after request navigate to home page.
    } catch (error: any) {
      console.error("Error scheduling pickup:", error);
      setPickupError(
        error.response?.data?.message ||
          "Failed to schedule pickup. Please try again."
      );
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              data-readdy="true"
              className="text-emerald-600 hover:text-emerald-700"
            >
              <i className="fas fa-arrow-left text-lg"></i>
            </a>
            <div className="text-2xl font-bold text-emerald-600">
              {t.schedulePickup}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  language === "en"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  language === "gu"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                onClick={() => setLanguage("gu")}
              >
                ગુજરાતી
              </button>
            </div>
                        <button className="cursor-pointer">
              <a href="/profile" className="text-gray-600 hover:text-emerald-600"><i className="fas fa-user-circle text-2xl"></i></a>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">
        {pickupError && <div className="text-red-500 mt-4">{pickupError}</div>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">{t.contactInfo}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    value={contact.fullName}
                    onChange={(e) =>
                      setContact({ ...contact, fullName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.phoneNumber}
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={contact.phone}
                    onChange={(e) =>
                      setContact({ ...contact, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.emailAddress}
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={contact.email}
                    onChange={(e) =>
                      setContact({ ...contact, email: e.target.value })
                    }
                  />
                </div>
              </div>
            </section>
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">{t.pickupSchedule}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.preferredDate}
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.preferredTime}
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  >
                    <option value="">{t.selectTimeSlot}</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">{t.eWasteItems}</h2>
              <div className="space-y-6">
                {Object.entries(selectedItems).map(([category, subItems]) => (
                  <div
                    key={category}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-800">
                        {category}
                      </h3>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-recycle text-emerald-500"></i>
                        <span className="text-sm text-gray-500">
                          {Object.values(subItems).reduce(
                            (acc, curr) => acc + curr,
                            0
                          )}{" "}
                          {t.items}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(subItems).map(
                        ([subCategory, quantity]) => (
                          <div
                            key={`${category}-${subCategory}`}
                            className="bg-gray-50 p-4 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {subCategory}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                className="!rounded-button whitespace-nowrap w-8 h-8 flex items-center justify-center bg-white text-gray-600 rounded-full hover:bg-gray-100 border border-gray-200"
                                onClick={() => {
                                  if (quantity > 0) {
                                    setSelectedItems({
                                      ...selectedItems,
                                      [category]: {
                                        ...selectedItems[category],
                                        [subCategory]: quantity - 1,
                                      },
                                    });
                                  }
                                }}
                              >
                                <i className="fas fa-minus text-sm"></i>
                              </button>
                              <span className="w-8 text-center font-medium">
                                {quantity}
                              </span>
                              <button
                                className="!rounded-button whitespace-nowrap w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 border border-emerald-200"
                                onClick={() => {
                                  if (quantity < 10) {
                                    setSelectedItems({
                                      ...selectedItems,
                                      [category]: {
                                        ...selectedItems[category],
                                        [subCategory]: quantity + 1,
                                      },
                                    });
                                  }
                                }}
                              >
                                <i className="fas fa-plus text-sm"></i>
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="space-y-4">
            <section className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">{t.pickupLocation}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.streetAddress}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    value={address.street}
                    onChange={(e) =>
                      setAddress({ ...address, street: e.target.value })
                    }
                    placeholder={t.enterStreetAddress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.apartmentSuite}
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                    value={address.apartment}
                    onChange={(e) =>
                      setAddress({ ...address, apartment: e.target.value })
                    }
                    placeholder={t.enterApartment}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.city}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                      value={address.city}
                      onChange={(e) =>
                        setAddress({ ...address, city: e.target.value })
                      }
                      placeholder={t.enterCity}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.pinCode}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                      value={address.pinCode}
                      onChange={(e) =>
                        setAddress({ ...address, pinCode: e.target.value })
                      }
                      placeholder={t.enterPinCode}
                    />
                  </div>
                </div>
              </div>
              <div
                ref={mapRef}
                className="w-full h-[400px] mt-4 rounded-lg overflow-hidden border border-gray-200"
              ></div>
            </section>
            <section className="bg-emerald-50 rounded-xl p-8 sticky top-28">
              <h2 className="text-xl font-semibold mb-6">{t.pickupSummary}</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{t.totalItems}</span>
                  <span className="font-semibold">
                    {Object.values(selectedItems).reduce(
                      (acc, subItems) =>
                        acc +
                        Object.values(subItems).reduce((a, b) => a + b, 0),
                      0
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{t.greenPointsEarn}</span>
                  <span className="font-semibold text-emerald-600">
                    {totalPoints} {t.points}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{t.pickupDate}</span>
                  <span className="font-semibold">
                    {selectedDate || t.notSelected}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{t.timeSlot}</span>
                  <span className="font-semibold">
                    {selectedTime || t.notSelected}
                  </span>
                </div>
              </div>
              {pickupError && (
                <div className="text-red-500 mt-4">{pickupError}</div>
              )}
              <div className="mt-8">
                <button
                  onClick={handleSubmit}
                  className="!rounded-button whitespace-nowrap cursor-pointer w-full bg-emerald-600 text-white py-5 text-xl font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-lg hover:scale-[1.02] transform"
                >
                  <i className="fas fa-calendar-check"></i>
                  {t.scheduleButton}
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};
export default App;
