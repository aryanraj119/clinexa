import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { runQuery, updateRecord } from "@/integrations/local-db/client";

const TABLES = [
  "users",
  "profiles",
  "doctors",
  "specializations",
  "appointments",
  "reviews",
  "blood_banks",
  "blood_inventory",
  "donor_profiles",
  "emergency_blood_requests",
  "donation_requests",
  "user_roles"
];

export default function DatabaseViewer() {
  const [selectedTable, setSelectedTable] = useState("users");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedTable]);

  const fetchData = () => {
    setLoading(true);
    try {
      const results = runQuery(selectedTable);
      setData(results as any[]);
    } catch (e) {
      console.error(e);
      setData([]);
    }
    setLoading(false);
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("clinexa_db");
      window.location.reload();
    }
  };

  const handleVerifyDoctor = (doctorId: string) => {
    updateRecord("doctors", doctorId, { verified: true, rejected: false });
    fetchData();
  };

  const handleRejectDoctor = (doctorId: string) => {
    if (confirm("Are you sure you want to reject this doctor?")) {
      updateRecord("doctors", doctorId, { verified: false, rejected: true });
      fetchData();
    }
  };

  const renderDoctorsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="capitalize">doctors</span>
          <Badge variant="secondary">{data.length} records</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Actions</th>
                  {Object.keys(data[0] || {}).filter(k => k !== 'id').map(key => (
                    <th key={key} className="text-left p-2 font-medium capitalize">
                      {key.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex gap-2">
                        {!row.verified && !row.rejected && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleVerifyDoctor(row.id)}
                            >
                              Verify
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRejectDoctor(row.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {row.verified && (
                          <Badge variant="default" className="bg-green-500">Verified</Badge>
                        )}
                        {row.rejected && (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </div>
                    </td>
                    {Object.entries(row).filter(([k]) => k !== 'id').map(([key, value], j) => (
                      <td key={j} className="p-2 max-w-xs truncate">
                        {typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDefaultTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="capitalize">{selectedTable}</span>
          <Badge variant="secondary">{data.length} records</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No records found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {Object.keys(data[0] || {}).map(key => (
                    <th key={key} className="text-left p-2 font-medium">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    {Object.values(row).map((value: any, j) => (
                      <td key={j} className="p-2 max-w-xs truncate">
                        {typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">View and manage registered users and data</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>Refresh</Button>
            <Button variant="destructive" onClick={handleClearData}>Clear All Data</Button>
          </div>
        </div>

        <Tabs value={selectedTable} onValueChange={setSelectedTable}>
          <TabsList className="flex flex-wrap h-auto">
            {TABLES.map(table => (
              <TabsTrigger key={table} value={table} className="capitalize">
                {table}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABLES.map(table => (
            <TabsContent key={table} value={table}>
              {table === 'doctors' ? renderDoctorsTable() : renderDefaultTable()}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
