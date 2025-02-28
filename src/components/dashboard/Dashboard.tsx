import { Card } from "@/components/ui/card";
import { Calendar, ShoppingCart, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8 px-4 sm:px-0">
        <h1 className="text-3xl font-bold text-center">FWS Technik</h1>

        <div className="grid md:grid-cols-3 gap-6">
          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center space-y-4"
            onClick={() => navigate("/events")}
          >
            <Calendar className="w-12 h-12 text-primary" />
            <h2 className="text-xl font-semibold">Veranstaltungen</h2>
          </Card>

          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center space-y-4"
            onClick={() => navigate("/shopping")}
          >
            <ShoppingCart className="w-12 h-12 text-primary" />
            <h2 className="text-xl font-semibold">Einkaufszettel</h2>
          </Card>

          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center space-y-4"
            onClick={() => navigate("/inventory")}
          >
            <Package className="w-12 h-12 text-primary" />
            <h2 className="text-xl font-semibold">Lager</h2>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
