import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';

type Tab = 'Dashboard' | 'Load Board' | 'Route Map' | 'Financials' | 'Compliance' | 'Settings';

type Load = {
  id: string;
  lane: string;
  rate: number;
  miles: number;
  deadhead: number;
};

const palette = {
  royalBlue: '#0057FF',
  sunshineYellow: '#FFD93D',
  white: '#FFFFFF',
  charcoalBlack: '#1A1A1A',
  mint: '#DFF5E1',
  sky: '#EAF1FF',
};

const starterLoads: Load[] = [
  { id: 'L-101', lane: 'Dallas, TX → Atlanta, GA', rate: 3650, miles: 780, deadhead: 34 },
  { id: 'L-102', lane: 'Houston, TX → Nashville, TN', rate: 3125, miles: 685, deadhead: 22 },
  { id: 'L-103', lane: 'Charlotte, NC → Miami, FL', rate: 2800, miles: 720, deadhead: 48 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [loads] = useState(starterLoads);
  const [bookedLoadIds, setBookedLoadIds] = useState<string[]>([]);
  const [selectedLoadId, setSelectedLoadId] = useState<string>('L-101');
  const [fuelCost, setFuelCost] = useState(0);
  const [invoicePaidCount, setInvoicePaidCount] = useState(0);
  const [hosComplete, setHosComplete] = useState(false);
  const [maintenanceComplete, setMaintenanceComplete] = useState(false);
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [role, setRole] = useState<'Owner-Operator' | 'Fleet Manager' | 'Dispatcher'>('Owner-Operator');
  const [statusMessage, setStatusMessage] = useState('Welcome to Prince Haul Intelligence.');

  const bookedLoads = loads.filter((load) => bookedLoadIds.includes(load.id));
  const selectedLoad = loads.find((load) => load.id === selectedLoadId) ?? loads[0];

  const grossRevenue = useMemo(
    () => bookedLoads.reduce((sum, load) => sum + load.rate, 0),
    [bookedLoads],
  );
  const netRevenue = grossRevenue - fuelCost;

  const bookLoad = (load: Load) => {
    setSelectedLoadId(load.id);
    if (bookedLoadIds.includes(load.id)) {
      setStatusMessage(`${load.id} is already booked.`);
      return;
    }

    setBookedLoadIds((prev) => [...prev, load.id]);
    setStatusMessage(`Booked ${load.id} for $${load.rate.toLocaleString()}.`);
  };

  const optimizeRoute = () => {
    setStatusMessage(`Route optimized for ${selectedLoad.id}: fuel stop + weather-safe corridor selected.`);
  };

  const addFuelExpense = () => {
    setFuelCost((prev) => prev + 145);
    setStatusMessage('Fuel expense added: $145.');
  };

  const markInvoicePaid = () => {
    if (bookedLoads.length === 0) {
      setStatusMessage('Book a load first to generate and mark invoices.');
      return;
    }

    setInvoicePaidCount((prev) => prev + 1);
    setStatusMessage('Invoice marked paid and dashboard earnings updated.');
  };

  const toggleHOS = () => {
    setHosComplete((prev) => !prev);
    setStatusMessage(`HOS checklist ${hosComplete ? 'reopened' : 'completed'}.`);
  };

  const toggleMaintenance = () => {
    setMaintenanceComplete((prev) => !prev);
    setStatusMessage(`Maintenance checklist ${maintenanceComplete ? 'reopened' : 'completed'}.`);
  };

  const toggleNotifications = () => {
    setNotificationsOn((prev) => !prev);
    setStatusMessage(`Notifications ${notificationsOn ? 'disabled' : 'enabled'}.`);
  };

  const switchRole = () => {
    setRole((prev) => {
      if (prev === 'Owner-Operator') return 'Fleet Manager';
      if (prev === 'Fleet Manager') return 'Dispatcher';
      return 'Owner-Operator';
    });
    setStatusMessage('User role updated.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Image source={require('./assets/splash-icon.png')} style={styles.logo} />
        <View>
          <Text style={styles.title}>Prince Haul Intelligence</Text>
          <Text style={styles.subtitle}>AI trucking command center</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {(['Dashboard', 'Load Board', 'Route Map', 'Financials', 'Compliance', 'Settings'] as Tab[]).map(
          (tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </Pressable>
          ),
        )}
      </ScrollView>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Live Status</Text>
        <Text style={styles.statusValue}>{statusMessage}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.screenContainer}>
        {activeTab === 'Dashboard' && (
          <View style={styles.stack}>
            <StatCard label="Booked Loads" value={`${bookedLoads.length}`} />
            <StatCard label="Gross Revenue" value={`$${grossRevenue.toLocaleString()}`} />
            <StatCard label="Net Revenue" value={`$${netRevenue.toLocaleString()}`} />
            <StatCard
              label="Compliance"
              value={hosComplete && maintenanceComplete ? 'Compliant ✅' : 'Needs Attention ⚠️'}
            />
            <View style={styles.rowWrap}>
              <ActionButton label="Find Load" onPress={() => setActiveTab('Load Board')} />
              <ActionButton label="Plan Route" onPress={() => setActiveTab('Route Map')} />
              <ActionButton label="Track Profit" onPress={() => setActiveTab('Financials')} />
            </View>
          </View>
        )}

        {activeTab === 'Load Board' && (
          <View style={styles.stack}>
            {loads.map((load) => (
              <View key={load.id} style={styles.loadCard}>
                <Text style={styles.loadId}>{load.id}</Text>
                <Text style={styles.loadLane}>{load.lane}</Text>
                <Text style={styles.loadMeta}>
                  ${load.rate.toLocaleString()} • {load.miles} mi • {load.deadhead} deadhead
                </Text>
                <View style={styles.rowWrap}>
                  <ActionButton label="Select" onPress={() => setSelectedLoadId(load.id)} compact />
                  <ActionButton label="Book" onPress={() => bookLoad(load)} compact />
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'Route Map' && (
          <View style={styles.stack}>
            <Text style={styles.sectionTitle}>Selected Load: {selectedLoad.id}</Text>
            <Text style={styles.sectionText}>{selectedLoad.lane}</Text>
            <Text style={styles.sectionText}>Fuel stop: Loves #203 (lowest route cost)</Text>
            <Text style={styles.sectionText}>Rest stop: 10h break marker auto-scheduled</Text>
            <ActionButton label="Optimize Route" onPress={optimizeRoute} />
          </View>
        )}

        {activeTab === 'Financials' && (
          <View style={styles.stack}>
            <StatCard label="Gross Revenue" value={`$${grossRevenue.toLocaleString()}`} />
            <StatCard label="Fuel Expense" value={`$${fuelCost.toLocaleString()}`} />
            <StatCard label="Net Margin" value={`$${netRevenue.toLocaleString()}`} />
            <StatCard label="Invoices Paid" value={`${invoicePaidCount}`} />
            <View style={styles.rowWrap}>
              <ActionButton label="Add Fuel Expense" onPress={addFuelExpense} />
              <ActionButton label="Mark Invoice Paid" onPress={markInvoicePaid} />
            </View>
          </View>
        )}

        {activeTab === 'Compliance' && (
          <View style={styles.stack}>
            <CheckRow
              label="HOS updated"
              value={hosComplete}
              onToggle={toggleHOS}
              buttonText={hosComplete ? 'Reopen' : 'Complete'}
            />
            <CheckRow
              label="Maintenance checklist"
              value={maintenanceComplete}
              onToggle={toggleMaintenance}
              buttonText={maintenanceComplete ? 'Reopen' : 'Complete'}
            />
          </View>
        )}

        {activeTab === 'Settings' && (
          <View style={styles.stack}>
            <StatCard label="Role" value={role} />
            <StatCard label="Notifications" value={notificationsOn ? 'Enabled' : 'Disabled'} />
            <View style={styles.rowWrap}>
              <ActionButton label="Switch Role" onPress={switchRole} />
              <ActionButton label="Toggle Notifications" onPress={toggleNotifications} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  onPress,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable style={[styles.actionButton, compact && styles.compactButton]} onPress={onPress}>
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function CheckRow({
  label,
  value,
  onToggle,
  buttonText,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  buttonText: string;
}) {
  return (
    <View style={styles.checkRow}>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value ? 'Complete ✅' : 'Pending ⏳'}</Text>
      </View>
      <ActionButton label={buttonText} onPress={onToggle} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.charcoalBlack,
  },
  subtitle: {
    fontSize: 13,
    color: palette.charcoalBlack,
  },
  tabBar: {
    maxHeight: 54,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  tabButton: {
    backgroundColor: palette.sky,
    borderColor: palette.royalBlue,
    borderWidth: 1,
    borderRadius: 999,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  activeTabButton: {
    backgroundColor: palette.royalBlue,
  },
  tabText: {
    color: palette.royalBlue,
    fontWeight: '700',
  },
  activeTabText: {
    color: palette.white,
  },
  statusCard: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: palette.sunshineYellow,
    borderRadius: 14,
    padding: 12,
    borderColor: palette.charcoalBlack,
    borderWidth: 1,
  },
  statusLabel: {
    color: palette.charcoalBlack,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 2,
  },
  statusValue: {
    color: palette.charcoalBlack,
    fontWeight: '600',
  },
  screenContainer: {
    padding: 14,
    paddingBottom: 44,
  },
  stack: {
    gap: 10,
  },
  statCard: {
    backgroundColor: palette.sky,
    borderRadius: 14,
    borderColor: palette.royalBlue,
    borderWidth: 1,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: palette.charcoalBlack,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 18,
    color: palette.charcoalBlack,
    fontWeight: '800',
    marginTop: 4,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    backgroundColor: palette.royalBlue,
    borderRadius: 12,
    borderColor: palette.charcoalBlack,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  compactButton: {
    paddingVertical: 8,
  },
  actionButtonText: {
    color: palette.white,
    fontWeight: '800',
  },
  loadCard: {
    borderWidth: 1,
    borderColor: palette.charcoalBlack,
    borderRadius: 14,
    padding: 12,
    backgroundColor: palette.mint,
  },
  loadId: {
    fontWeight: '900',
    fontSize: 16,
    color: palette.charcoalBlack,
  },
  loadLane: {
    marginTop: 4,
    color: palette.charcoalBlack,
    fontWeight: '600',
  },
  loadMeta: {
    marginTop: 6,
    marginBottom: 8,
    color: palette.charcoalBlack,
  },
  sectionTitle: {
    color: palette.charcoalBlack,
    fontWeight: '800',
    fontSize: 18,
  },
  sectionText: {
    color: palette.charcoalBlack,
    fontWeight: '500',
  },
  checkRow: {
    borderColor: palette.charcoalBlack,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: palette.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
