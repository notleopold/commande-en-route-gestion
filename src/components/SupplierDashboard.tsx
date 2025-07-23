
import React, { useState, useEffect } from "react";
import { DashboardCard } from "./DashboardCard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Building2, TrendingUp, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  inactiveSuppliers: number;
  testingSuppliers: number;
  avgReliabilityRating: number;
  avgPreparationTime: number;
  exclusiveSuppliers: number;
}

export const SupplierDashboard: React.FC = () => {
  const [stats, setStats] = useState<SupplierStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    testingSuppliers: 0,
    avgReliabilityRating: 0,
    avgPreparationTime: 0,
    exclusiveSuppliers: 0
  });
  const [loading, setLoading] = useState(true);
  const [suppliersByCountry, setSuppliersByCountry] = useState<any[]>([]);
  const [reliabilityData, setReliabilityData] = useState<any[]>([]);

  useEffect(() => {
    fetchSupplierStats();
  }, []);

  const fetchSupplierStats = async () => {
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*');

      if (error) throw error;

      const totalSuppliers = suppliers.length;
      const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
      const inactiveSuppliers = suppliers.filter(s => s.status === 'inactive').length;
      const testingSuppliers = suppliers.filter(s => s.status === 'under_testing').length;
      const exclusiveSuppliers = suppliers.filter(s => s.exclusive_to_client).length;

      const avgReliabilityRating = suppliers.reduce((sum, s) => sum + (s.reliability_rating || 0), 0) / totalSuppliers;
      const avgPreparationTime = suppliers.reduce((sum, s) => sum + (s.preparation_time || 0), 0) / totalSuppliers;

      // Group by country
      const countryGroups = suppliers.reduce((acc, supplier) => {
        const country = supplier.country || 'Non spécifié';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const countryData = Object.entries(countryGroups)
        .map(([country, count]) => ({ name: country, value: count }))
        .slice(0, 8); // Top 8 countries

      // Reliability distribution
      const reliabilityGroups = suppliers.reduce((acc, supplier) => {
        const rating = supplier.reliability_rating || 0;
        const group = rating === 5 ? 'Excellent' : rating >= 4 ? 'Bon' : rating >= 3 ? 'Moyen' : rating >= 2 ? 'Faible' : 'Très faible';
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const reliabilityChartData = Object.entries(reliabilityGroups)
        .map(([rating, count]) => ({ name: rating, value: count }));

      setStats({
        totalSuppliers,
        activeSuppliers,
        inactiveSuppliers,
        testingSuppliers,
        avgReliabilityRating,
        avgPreparationTime,
        exclusiveSuppliers
      });

      setSuppliersByCountry(countryData);
      setReliabilityData(reliabilityChartData);
    } catch (error) {
      console.error('Error fetching supplier stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  if (loading) {
    return <div className="p-6">Chargement des statistiques...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Fournisseurs"
          value={stats.totalSuppliers}
          subtitle="Tous statuts confondus"
          icon={<Building2 className="h-4 w-4" />}
        />
        <DashboardCard
          title="Fournisseurs Actifs"
          value={stats.activeSuppliers}
          subtitle={`${((stats.activeSuppliers / stats.totalSuppliers) * 100).toFixed(1)}% du total`}
          color="success"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <DashboardCard
          title="Note Moyenne"
          value={`${stats.avgReliabilityRating.toFixed(1)}/5`}
          subtitle="Fiabilité générale"
          icon={<TrendingUp className="h-4 w-4" />}
          color={stats.avgReliabilityRating >= 4 ? "success" : stats.avgReliabilityRating >= 3 ? "warning" : "danger"}
        />
        <DashboardCard
          title="Délai Moyen"
          value={`${Math.round(stats.avgPreparationTime)} jours`}
          subtitle="Temps de préparation"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="En Test"
          value={stats.testingSuppliers}
          subtitle="Fournisseurs à valider"
          color="warning"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <DashboardCard
          title="Inactifs"
          value={stats.inactiveSuppliers}
          subtitle="Fournisseurs suspendus"
          color="danger"
        />
        <DashboardCard
          title="Exclusifs"
          value={stats.exclusiveSuppliers}
          subtitle="Réservés à des clients"
        />
        <DashboardCard
          title="Taux Activité"
          value={`${((stats.activeSuppliers / stats.totalSuppliers) * 100).toFixed(1)}%`}
          subtitle="Fournisseurs opérationnels"
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Pays</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={suppliersByCountry}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par Fiabilité</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reliabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reliabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
