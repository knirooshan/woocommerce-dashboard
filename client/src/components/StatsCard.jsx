const StatsCard = ({ title, value, icon: Icon, color }) => {
  // Extract the color name (e.g., "green" from "text-green-600 bg-green-600")
  // This is a bit hacky but works with the current props structure
  const colorName = color.split("-")[1];

  return (
    <div className="bg-slate-900 rounded-lg shadow border border-slate-800 p-6 flex items-center">
      <div className={`p-3 rounded-full bg-${colorName}-500/10 mr-4`}>
        <Icon className={`h-6 w-6 text-${colorName}-500`} />
      </div>
      <div>
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
