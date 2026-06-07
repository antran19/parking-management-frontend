// src/data/parkingData.js

export const mapAreas = [
  {
    id: "A",
    name: "Khu A",
    position: "Góc trái trên",
    note: "Gần cổng vào tầng",
  },
  {
    id: "B",
    name: "Khu B",
    position: "Góc phải trên",
    note: "Gần thang máy",
  },
  {
    id: "C",
    name: "Khu C",
    position: "Góc trái dưới",
    note: "Gần lối ra nội bộ",
  },
  {
    id: "D",
    name: "Khu D",
    position: "Góc phải dưới",
    note: "Gần khu chờ",
  },
];

export const parkingFloors = [
  {
    id: "A1",
    label: "Tầng A1",
    title: "Tầng xe đạp / xe điện",
    icon: "🚲",
    vehicleGroups: ["BICYCLE", "E_BIKE"],
    vehicleLabel: "Xe đạp / Xe điện",
    description:
      "Tầng A1 dành cho xe đạp và xe điện. Khu A/B/C/D chỉ dùng để định hướng mặt bằng.",
    capacity: 220,
    occupied: 96,
    reserved: 18,
  },
  {
    id: "A2",
    label: "Tầng A2",
    title: "Tầng xe máy",
    icon: "🏍️",
    vehicleGroups: ["MOTORBIKE"],
    vehicleLabel: "Xe máy",
    description:
      "Tầng A2 dành cho xe máy. Driver chỉ xem tổng slot theo tầng, không chọn slot cụ thể.",
    capacity: 320,
    occupied: 186,
    reserved: 24,
  },
  {
    id: "B1",
    label: "Tầng B1",
    title: "Tầng ô tô 4 - 5 - 7 chỗ",
    icon: "🚗",
    vehicleGroups: ["CAR_4", "CAR_5", "CAR_7"],
    vehicleLabel: "Ô tô 4 - 5 - 7 chỗ",
    description:
      "Tầng B1 dành cho ô tô gia đình. Khu A/B/C/D là map vị trí của tầng đang chọn.",
    capacity: 180,
    occupied: 91,
    reserved: 12,
  },
  {
    id: "B2",
    label: "Tầng B2",
    title: "Tầng ô tô 4 - 5 - 7 chỗ",
    icon: "🚘",
    vehicleGroups: ["CAR_4", "CAR_5", "CAR_7"],
    vehicleLabel: "Ô tô 4 - 5 - 7 chỗ",
    description:
      "Tầng B2 là tầng ô tô dự phòng. Driver xem tổng capacity theo tầng và chọn khu A/B/C/D để định hướng.",
    capacity: 190,
    occupied: 102,
    reserved: 16,
  },
  {
    id: "C1",
    label: "Tầng C1",
    title: "Tầng xe 16 chỗ",
    icon: "🚐",
    vehicleGroups: ["VAN_16"],
    vehicleLabel: "Xe 16 chỗ",
    description:
      "Tầng C1 dành cho xe 16 chỗ. Staff sẽ xác nhận bằng QR tại cổng tầng.",
    capacity: 80,
    occupied: 37,
    reserved: 6,
  },
];

export const vehicleOptions = [
  {
    value: "BICYCLE",
    label: "Xe đạp",
    group: "BICYCLE",
    pricePerHour: 3000,
  },
  {
    value: "E_BIKE",
    label: "Xe điện",
    group: "E_BIKE",
    pricePerHour: 4000,
  },
  {
    value: "MOTORBIKE",
    label: "Xe máy",
    group: "MOTORBIKE",
    pricePerHour: 5000,
  },
  {
    value: "CAR_4",
    label: "Ô tô 4 chỗ",
    group: "CAR_4",
    pricePerHour: 15000,
  },
  {
    value: "CAR_5",
    label: "Ô tô 5 chỗ",
    group: "CAR_5",
    pricePerHour: 15000,
  },
  {
    value: "CAR_7",
    label: "Ô tô 7 chỗ",
    group: "CAR_7",
    pricePerHour: 18000,
  },
  {
    value: "VAN_16",
    label: "Xe 14 - 16 chỗ",
    group: "VAN_16",
    pricePerHour: 30000,
  },
];

export const passPlans = [
  {
    value: "MONTHLY",
    label: "Vé tháng",
    durationLabel: "30 ngày",
    months: 1,
    discount: 0,
  },
  {
    value: "QUARTERLY",
    label: "Vé quý",
    durationLabel: "90 ngày",
    months: 3,
    discount: 0.05,
  },
  {
    value: "YEARLY",
    label: "Vé năm",
    durationLabel: "365 ngày",
    months: 12,
    discount: 0.15,
  },
];

export const passBasePrices = {
  BICYCLE: 90000,
  E_BIKE: 120000,
  MOTORBIKE: 150000,
  CAR_4: 1200000,
  CAR_5: 1200000,
  CAR_7: 1500000,
  VAN_16: 1800000,
};

export function getVehicleLabel(vehicleType) {
  return (
    vehicleOptions.find((vehicle) => vehicle.value === vehicleType)?.label ||
    vehicleType
  );
}

export function getPassPlanLabel(passType) {
  return passPlans.find((plan) => plan.value === passType)?.label || passType;
}

export function getFloorById(floorId) {
  return parkingFloors.find((floor) => floor.id === floorId) || parkingFloors[0];
}

export function getFloorAvailable(floor) {
  return Math.max(floor.capacity - floor.occupied - floor.reserved, 0);
}

export function getFloorPercent(floor) {
  if (!floor.capacity) return 0;
  return Math.round(((floor.occupied + floor.reserved) / floor.capacity) * 100);
}

export function getParkingSummary() {
  const capacity = parkingFloors.reduce((sum, floor) => sum + floor.capacity, 0);
  const occupied = parkingFloors.reduce((sum, floor) => sum + floor.occupied, 0);
  const reserved = parkingFloors.reduce((sum, floor) => sum + floor.reserved, 0);

  return {
    capacity,
    occupied,
    reserved,
    available: capacity - occupied - reserved,
  };
}

export function getSuggestedFloor(vehicleType) {
  const exactFloor = parkingFloors.find((floor) =>
    floor.vehicleGroups.includes(vehicleType)
  );

  if (exactFloor && getFloorAvailable(exactFloor) > 0) {
    return exactFloor;
  }

  return parkingFloors.find((floor) => getFloorAvailable(floor) > 0) || parkingFloors[0];
}

export function calculatePassPrice(vehicleType, passType) {
  const basePrice = passBasePrices[vehicleType] || 150000;
  const plan = passPlans.find((item) => item.value === passType) || passPlans[0];
  const rawPrice = basePrice * plan.months;
  return Math.round(rawPrice * (1 - plan.discount));
}
