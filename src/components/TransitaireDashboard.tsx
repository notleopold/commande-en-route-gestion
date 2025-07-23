
import React, { useState, useEffect } from "react";
import { DashboardCard } from "./DashboardCard";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Truck, CheckCircle, AlertTriangle, Globe, Package, Shield } from "lucide-react";

interface TransitaireStats {
  totalTransitaires: number;
  activeTransitaires: number;
  inactiveTransitaires: number;
  avgCapacity: number;
  dangerousGoodsCertified: number;
  totalReservations: number;
  specialtyDistribution: any[];
  serviceDistribution: any[];
}

export const TransitaireDashboard: React.FC = () => {
  const [stats, setStats] = useState<TransitaireStats>({
    totalTransitaires: 0,
    activeTransitaires: 0,
    inactiveTransitaires: 0,
    avgCapacity: 0,
    dangerousGoodsCertified: 0,
    totalReservations: 0,
    specialtyDistribution: [],
    serviceDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [countryData, setCountryData] = useState<any[]>([]);

  useEffect(() => {
    fetchTransitaireStats();
  }, []);

  const fetchTransitaireStats = async () => {
    try {
      const { data: transitaires, error } = await supabase
        .from('transitaires')
        .select('*');

      if (error) throw error;

      const { data: reservations } = await supabase
        .from('reservations')
        .select('transitaire');

      const totalTransitaires = transitaires.length;
      const activeTransitaires = transitaires.filter(t => t.status === 'active').length;
      const inactiveTransitaires = transitaires.filter(t => t.status === 'inactive').length;
      const dangerousGoodsCertified = transitaires.filter(t => t.dangerous_goods_certified).length;
      const totalReservations = reservations?.length || 0;

      const avgCapacity = transitaires.reduce((sum, t) => sum + (t.max_container_capacity || 0), 0) / totalTransitaires;

      // Services distribution
      const allServices = transitaires.flatMap(t => t.services || []);
      const serviceGroups = allServices.reduce((acc, service) => {
        acc[service] = (acc[service] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const serviceDistribution = Object.entries(serviceGroups)
        .map(([service, count]) => ({ name: service, value: count }));

      // Specialties distribution
      const allSpecialties = transitaires.flatMap(t => t.specialties || []);
      const specialtyGroups = allSpecialties.reduce((acc, specialty) => {
        acc[specialty] = (acc[specialty] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const specialtyDistribution = Object.entries(specialtyGroups)
        .map(([specialty, count]) => ({ name: specialty, value: count }));

      // Country distribution
      const countryGroups = transitaires.reduce((acc, transitaire) => {
        const country = transitaire.country || 'Non spécifié';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const countryChartData = Object.entries(countryGroups)
        .map(([country, count]) => ({ name: country, value: count }));

      setStats({
        totalTransitaires,
        activeTransitaires,
        inactiveTransitaires,
        avgCapacity,
        dangerousGoodsCertified,
        totalReservations,
        specialtyDistribution,
        serviceDistribution
      });

      setCountryData(countryChartData);
    } catch (error) {
      console.error('Error fetching transitaire stats:', error);
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
          title="Total Transitaires"
          value={stats.totalTransitaires}
          subtitle="Partenaires logistiques"
          icon={<Truck className="h-4 w-4" />}
        />
        <DashboardCard
          title="Transitaires Actifs"
          value={stats.activeTransitaires}
          subtitle={`${((stats.activeTransitaires / stats.totalTransitaires) * 100).toFixed(1)}% du total`}
          color="success"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <DashboardCard
          title="Capacité Moyenne"
          value={`${Math.round(stats.avgCapacity)} cont.`}
          subtitle="Conteneurs par transitaire"
          icon={<Package className="h-4 w-4" />}
        />
        <DashboardCard
          title="Certifiés MD"
          value={stats.dangerousGoodsCertified}
          subtitle="Marchandises dangereuses"
          color="warning"
          icon={<Shield className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Réservations"
          value={stats.totalReservations}
          subtitle="Total des réservations"
          icon={<Globe className="h-4 w-4" />}
        />
        <DashboardCard
          title="Inactifs"
          value={stats.inactiveTransitaires}
          subtitle="Transitaires suspendus"
          color="danger"
        />
        <DashboardCard
          title="Taux Activité"
          value={`${((stats.activeTransitaires / stats.totalTransitaires) * 100).toFixed(1)}%`}
          subtitle="Transitaires opérationnels"
          color="success"
        />
        <DashboardCard
          title="Taux Certification"
          value={`${((stats.dangerousGoodsCertified / stats.totalTransitaires) * 100).toFixed(1)}%`}
          subtitle="Certifiés MD"
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.serviceDistribution}>
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
            <CardTitle>Spécialités Géographiques</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.specialtyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.specialtyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Répartition par Pays</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
