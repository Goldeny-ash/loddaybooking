import React from "react";

interface StaffCardProps {
  name: string;
  role: string;
  availability: string;
}

const StaffCard: React.FC<StaffCardProps> = ({ name, role, availability }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-[220px]">
      <h4 className="font-semibold">{name}</h4>
      <p className="text-sm text-gray-500">{role}</p>
      <p className="text-sm mt-1">{availability}</p>
    </div>
  );
};

export default StaffCard;
