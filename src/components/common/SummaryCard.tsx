
import type { ReactNode } from "react";

type SummaryCardProps = {
  title: string;
  amount: string;
  icon: ReactNode;
  description: string;
};

function SummaryCard({
  title,
  amount,
  icon,
  description,
}: SummaryCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="bg-green-50 text-green-600 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">{amount}</h2>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
  );
}

export default SummaryCard;
