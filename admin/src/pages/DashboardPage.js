import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiTrendingUp, FiTarget, FiDollarSign,
  FiEdit, FiTrash2, FiHome, FiRefreshCw,
  FiDownload, FiSearch, FiMessageSquare, FiUserPlus,
  FiBarChart2, FiPieChart, FiUser, FiGrid,
  FiEye, FiCheck, FiX, FiPlus, FiFilter,
  FiMail, FiPhone, FiMapPin, FiCalendar,
  FiCreditCard, FiActivity, FiShoppingBag, FiSettings, FiUpload
} from 'react-icons/fi';
import ClientInquiriesSection from '../components/ClientInquiriesSection';
import useToastStore from '../store/toastStore';
import DiscountsPage from './DiscountsPage';
import { FiLogOut } from 'react-icons/fi';
import useAuthStore from '../store/authStore';

const DashboardPage = () => {
  // Agents for lead assignment
  const [agents, setAgents] = useState([]);
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);

  // Dashboard data state
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalClients: 0,
    totalProperties: 0,
    monthlyGrowth: 0,
    pendingProperties: 0,
    activeUsers: 0
  });

  // Sample data for charts
  const [propertiesStatusData, setPropertiesStatusData] = useState([]);
  const [leadsData, setLeadsData] = useState([]);
  // Leads overview: weekly & monthly
  const [leadsWeekCount, setLeadsWeekCount] = useState(0);
  const [leadsMonthCount, setLeadsMonthCount] = useState(0);
  const [leadsWeekData, setLeadsWeekData] = useState([]);
  const [leadsMonthData, setLeadsMonthData] = useState([]);

  // Data arrays
  const [allProperties, setAllProperties] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [allLeads, setAllLeads] = useState([]);

  // Derived map: agentId -> number of assigned leads (used for suggestions/quotas)
  const agentAssignedMap = useMemo(() => {
    const map = {};
    try {
      (allLeads || []).forEach(l => {
        const assigned = l?.assignedTo;
        const id = assigned?._id || assigned;
        if (!id) return;
        const key = String(id);
        map[key] = (map[key] || 0) + 1;
      });
    } catch (e) {
      // ignore
    }
    return map;
  }, [allLeads]);

  // Modal states
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);

  // Form states
  const [newProperty, setNewProperty] = useState({
    title: '',
    location: '',
    price: '',
    status: 'pending',
    owner: '',
    images: ['']
  });

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    company: '',
    licenseNumber: '',
    commissionRate: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    }
    ,
    // Membership defaults for agent creation
    membership: {
      program: 'Realizty',
      plan: '',
      leadsPerMonth: 0
    }
  });

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    status: 'active'
  });

  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    requirements: '',
    category: '',
    label: '',
    status: 'pending',
    company: '',
    country: '',
    stateProvince: '',
    city: '',
    internalNote: ''
  });


  const [editingItem, setEditingItem] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showPropertyView, setShowPropertyView] = useState(false);
  const [modalProperty, setModalProperty] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmCallbackRef = useRef(null);

  // Normalize image URL returned from server for admin UI
  const normalizeImageUrl = (url) => {
    if (!url) return url;
    try {
      if (typeof url === 'string') {
        if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
        if (url.startsWith('uploads/')) return `http://localhost:5000/${url}`;
      }
    } catch (e) {
      // ignore
    }
    return url;
  };

  const normalizeProperty = (prop) => {
    if (!prop) return prop;
    // shallow clone and normalize images array
    const copy = { ...prop };
    try {
      if (Array.isArray(copy.images)) {
        copy.images = copy.images.map(img => normalizeImageUrl(img));
      }
    } catch (e) {
      // ignore
    }
    return copy;
  };

  const normalizePropertyList = (list) => {
    if (!Array.isArray(list)) return list;
    return list.map(p => normalizeProperty(p));
  };

  // Helper to safely get a lead's display name when data shape varies
  const getLeadDisplayName = (lead) => {
    if (!lead) return '';
    if (lead.name) return lead.name;
    const first = lead.firstName || '';
    const last = lead.lastName || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (lead.email) return lead.email.split('@')[0];
    return 'Unknown';
  };

  // Resolve assigned agent display name defensively
  const getAssignedName = (lead) => {
    const a = lead?.assignedTo;
    if (!a) return '—';
    if (typeof a === 'object') {
      if (a.name) return a.name;
      if (a.firstName || a.lastName) return `${a.firstName || ''} ${a.lastName || ''}`.trim();
      if (a.email) return a.email;
      if (a._id) {
        const found = agents.find(x => String(x._id) === String(a._id) || String(x.id) === String(a._id));
        if (found) return found.name || found.email || String(found._id);
      }
      return String(a);
    }
    if (typeof a === 'string') {
      const byId = agents.find(x => String(x._id) === a || String(x.id) === a);
      if (byId) return byId.name || byId.email || String(byId._id);
      return a;
    }
    return '—';
  };

  // Agent profile modal state
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showAgentModal, setShowAgentModal] = useState(false);

  const openAgentModal = async (agentId) => {
    if (!agentId) return;
    // prefer fetching full agent record from server for freshest data
    let agent = agents.find(a => a && (String(a._id) === String(agentId) || String(a.id) === String(agentId)));
    try {
      const resp = await fetch(`http://localhost:5000/api/admin/users/${agentId}`);
      if (resp.ok) {
        const json = await resp.json();
        // support both { user: {...} } and direct user object
        agent = json.user || json.data || json || agent;
      }
    } catch (err) {
      // network failed — fallback to local agent data
      console.warn('Failed to fetch agent record:', err);
    }

    if (!agent) return;

    // compute assigned leads count
    const assignedCount = agentAssignedMap[String(agent._id)] || 0;
    // compute clients assigned to this agent (support clientInfo.assignedAgent)
    const clientsAssigned = (allClients || []).filter(c => {
      const assigned = c?.clientInfo?.assignedAgent || c?.assignedAgent || c?.assignedTo;
      return assigned && (String(assigned) === String(agent._id) || (assigned._id && String(assigned._id) === String(agent._id)));
    });

    // compute leads assigned to this agent
    const leadsAssigned = (allLeads || []).filter(l => {
      const assigned = l?.assignedTo;
      return assigned && (String(assigned) === String(agent._id) || (assigned._id && String(assigned._id) === String(agent._id)));
    });

    // normalize image
    const profileImage = agent.profileImage || agent.avatar || agent.image || agent.photo || agent.userImage || agent.profilePic || '';
    const profileImageUrl = normalizeImageUrl(profileImage) || '';

    setSelectedAgent({ ...agent, assignedCount, clientsAssigned, leadsAssigned, profileImageUrl });
    setShowAgentModal(true);
  };

  const closeAgentModal = () => {
    setShowAgentModal(false);
    setSelectedAgent(null);
  };

  // Helper to get an agent's readable location string
  const getAgentLocation = (agentId) => {
    if (!agentId || !Array.isArray(agents)) return '';
    const agent = agents.find(a => a && (String(a._id) === String(agentId) || String(a.id) === String(agentId)));
    if (!agent) return '';
    // Support multiple shapes: agent.address or agent.location
    const addr = agent.address || agent.location || {};
    const parts = [];
    if (addr.city) parts.push(addr.city);
    if (addr.state || addr.stateProvince) parts.push(addr.state || addr.stateProvince);
    if (addr.country) parts.push(addr.country);
    // fallback to top-level agent.city/agent.country
    if (parts.length === 0) {
      if (agent.city) parts.push(agent.city);
      if (agent.country) parts.push(agent.country);
    }
    return parts.join(', ');
  };

  // Fetch dashboard data
  // In your Admin Dashboard - Update fetchDashboardData function
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // ✅ REMOVED: Token requirement for now
      // const token = localStorage.getItem('token');

      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/admin/dashboard/stats');
      const statsData = await statsResponse.json();

      // Fetch pending properties
      const propertiesResponse = await fetch('http://localhost:5000/api/admin/properties?status=pending&limit=10');
      const propertiesData = await propertiesResponse.json();

      // Fetch all properties
      const allPropertiesResponse = await fetch('http://localhost:5000/api/admin/properties?limit=50');
      const allPropertiesData = await allPropertiesResponse.json();

      // Fetch users
      const usersResponse = await fetch('http://localhost:5000/api/admin/users?limit=10');
      const usersData = await usersResponse.json();

      // Fetch clients
      const clientsResponse = await fetch('http://localhost:5000/api/admin/users?role=client&limit=10');
      const clientsData = await clientsResponse.json();

      // Fetch leads
      const leadsResponse = await fetch('http://localhost:5000/api/leads?limit=10');
      const leadsData = await leadsResponse.json();

      // Fetch weekly/monthly leads summaries
      try {
        const weekResp = await fetch('http://localhost:5000/api/admin/dashboard/leads-week');
        const weekJson = await weekResp.json();
        if (weekJson && weekJson.success) {
          // Prefer assignedTotal if available (counts leads that were assigned in the period)
          setLeadsWeekCount(weekJson.assignedTotal ?? weekJson.total ?? 0);
          setLeadsWeekData(Array.isArray(weekJson.assignedPerDay) && weekJson.assignedPerDay.length > 0
            ? weekJson.assignedPerDay
            : (Array.isArray(weekJson.perDay) ? weekJson.perDay : []));
        }
      } catch (err) {
        console.warn('Failed to fetch weekly leads summary', err);
      }

      try {
        const monthResp = await fetch('http://localhost:5000/api/admin/dashboard/leads-month');
        const monthJson = await monthResp.json();
        if (monthJson && monthJson.success) {
          setLeadsMonthCount(monthJson.assignedTotal ?? monthJson.total ?? 0);
          setLeadsMonthData(Array.isArray(monthJson.assignedPerDay) && monthJson.assignedPerDay.length > 0
            ? monthJson.assignedPerDay
            : (Array.isArray(monthJson.perDay) ? monthJson.perDay : []));
        }
      } catch (err) {
        console.warn('Failed to fetch monthly leads summary', err);
      }

      // Fetch agents for assignment dropdown
      const agentsResponse = await fetch('http://localhost:5000/api/admin/agents');
      const agentsData = await agentsResponse.json();

      // Fetch property status data
      const statusResponse = await fetch('http://localhost:5000/api/admin/dashboard/properties-status');
      const statusData = await statusResponse.json();

      // ✅ Update state
      setStats(statsData || {});
      setPropertiesStatusData(Array.isArray(statusData) ? statusData : []);
      setAllProperties(normalizePropertyList(allPropertiesData.properties || allPropertiesData || []));
      setPendingProperties(normalizePropertyList(propertiesData.properties || propertiesData || []));
      setAllUsers(usersData.users || usersData || []);
      setAllClients(clientsData.users || clientsData || []);
      setAllLeads(leadsData.leads || leadsData || []);
      setAgents(agentsData.agents || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      useToastStore.getState().add({ type: 'error', message: 'Error loading data: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  // ✅ UPDATED: Property Approval/Rejection with proper state updates
  const handlePropertyAction = async (propertyId, action) => {
    try {
      console.log(`${action} property: ${propertyId}`);

      const response = await fetch(`http://localhost:5000/api/admin/properties/${propertyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'published' : 'rejected'
        })
      });

      const result = await response.json();

      if (response.ok) {
        useToastStore.getState().add({ type: 'success', message: `Property ${action}d successfully!` });

        const newStatus = action === 'approve' ? 'published' : 'rejected';

        // Update allProperties array
        setAllProperties(prevProperties =>
          prevProperties.map(property =>
            property._id === propertyId
              ? {
                ...property,
                status: newStatus,
                ...(newStatus === 'published' && { approvedAt: new Date() }),
                ...(newStatus === 'rejected' && { rejectedAt: new Date() })
              }
              : property
          )
        );

        // Remove from pending properties
        setPendingProperties(prev => prev.filter(p => p._id !== propertyId));

        // Update stats
        setStats(prev => ({
          ...prev,
          pendingProperties: Math.max(0, prev.pendingProperties - 1),
          totalProperties: action === 'approve' ? (prev.totalProperties || 0) + 1 : (prev.totalProperties || 0)
        }));

      } else {
        useToastStore.getState().add({ type: 'error', message: result.message || `Failed to ${action} property` });
      }
    } catch (error) {
      console.error(`Error ${action}ing property:`, error);
      useToastStore.getState().add({ type: 'error', message: `Error ${action}ing property: ${error.message}` });
    }
  };



  // ✅ UPDATED: Handle delete property
  const handleDeleteProperty = async (propertyId) => {
    setConfirmMessage('Are you sure you want to delete this property?');
    confirmCallbackRef.current = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/properties/${propertyId}`, {
          method: 'DELETE',
        });

        const result = await response.json();

        if (response.ok) {
          useToastStore.getState().add({ type: 'success', message: 'Property deleted successfully!' });

          // Update all state arrays
          setAllProperties(prev => prev.filter(p => p._id !== propertyId));
          setPendingProperties(prev => prev.filter(p => p._id !== propertyId));

          // Update stats
          setStats(prev => ({
            ...prev,
            totalProperties: Math.max(0, (prev.totalProperties || 0) - 1)
          }));
        } else {
          useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to delete property' });
        }
      } catch (error) {
        console.error('Error deleting property:', error);
        useToastStore.getState().add({ type: 'error', message: 'Error deleting property: ' + error.message });
      }
    };
    setShowConfirm(true);
  };

  // ✅ ADD: Handle delete user
  const handleDeleteUser = async (userId) => {
    setConfirmMessage('Are you sure you want to delete this user?');
    confirmCallbackRef.current = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
          method: 'DELETE'
        });

        const result = await res.json().catch(() => ({}));

        if (res.ok) {
          useToastStore.getState().add({ type: 'success', message: result.message || 'User deleted successfully' });
          // remove from local lists
          setAllUsers(prev => prev.filter(u => u._id !== userId));
          setAllClients(prev => prev.filter(c => c._id !== userId));
          // update active users stat if present
          setStats(prev => ({ ...prev, activeUsers: Math.max(0, (prev.activeUsers || 0) - 1) }));
        } else {
          useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to delete user' });
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        useToastStore.getState().add({ type: 'error', message: 'Error deleting user: ' + (err.message || err) });
      }
    };
    setShowConfirm(true);
  };

  // ✅ ADD: Handle delete lead
  const handleDeleteLead = async (leadId) => {
    setConfirmMessage('Are you sure you want to delete this lead?');
    confirmCallbackRef.current = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/leads/${leadId}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        const result = await res.json().catch(() => ({}));

        if (res.ok) {
          useToastStore.getState().add({ type: 'success', message: result.message || 'Lead deleted successfully' });
          setAllLeads(prev => prev.filter(l => l._id !== leadId));
          // update leads counts if present
          setLeadsWeekCount(prev => Math.max(0, (prev || 0) - 1));
          setLeadsMonthCount(prev => Math.max(0, (prev || 0) - 1));
        } else {
          useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to delete lead' });
        }
      } catch (err) {
        console.error('Error deleting lead:', err);
        useToastStore.getState().add({ type: 'error', message: 'Error deleting lead: ' + (err.message || err) });
      }
    };
    setShowConfirm(true);
  };

  // ✅ ADD: Function to force refresh all data
  const refreshAllData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // ✅ ADD: Real-time polling for updates
  useEffect(() => {
    // Poll every 30 seconds for updates
    const intervalId = setInterval(() => {
      if (!isLoading && activeSection === 'dashboard') {
        fetchDashboardData();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isLoading, activeSection]);

  // Rest of your functions remain the same...
  const handleAddUser = async (e) => {
    e.preventDefault();

    // Validate password
    if (!newUser.password || newUser.password.length < 6) {
      useToastStore.getState().add({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    try {
      const payload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        phone: newUser.phone || '',
      };

      // Add role-specific data
      if (newUser.role === 'client' && newUser.company) {
        payload.company = newUser.company;
      }

      if (newUser.role === 'agent') {
        if (newUser.licenseNumber) payload.licenseNumber = newUser.licenseNumber;
        if (newUser.commissionRate) payload.commissionRate = newUser.commissionRate;
        // include address for agents
        if (newUser.address) {
          payload.address = {
            street: newUser.address.street || '',
            city: newUser.address.city || '',
            state: newUser.address.state || newUser.address.stateProvince || '',
            country: newUser.address.country || '',
            zipCode: newUser.address.zipCode || ''
          };
        }
        // include membership selection if present
        if (newUser.membership) {
          payload.membership = newUser.membership;
        }
      }

      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        useToastStore.getState().add({ type: 'success', message: `${newUser.role} added successfully!` });

        // Add to appropriate list
        if (newUser.role === 'client') {
          if (activeSection === 'clients') {
            setAllClients(prev => [...prev, result.user]);
          }
        }
        // Always add to users list for admin view
        setAllUsers(prev => [...prev, result.user]);
      } else {
        useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to add user' });
      }
    } catch (error) {
      console.error('Error adding user:', error);
      useToastStore.getState().add({ type: 'error', message: 'Error adding user: ' + error.message });
    }

    setShowAddUser(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'user',
      phone: '',
      company: '',
      licenseNumber: '',
      commissionRate: '',
      address: { street: '', city: '', state: '', country: '', zipCode: '' },
      membership: { program: 'Realizty', plan: '', leadsPerMonth: 0 }
    });
  };
  // ✅ Add this handleAddLead function
  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      // Create lead data with ALL fields including assignedTo
      const leadData = {
        firstName: newLead.firstName.trim(),
        lastName: newLead.lastName.trim(),
        email: newLead.email.trim().toLowerCase(),
        phone: newLead.phone.trim() || '',
        requirements: newLead.requirements.trim() || '',
        category: newLead.category || '',
        label: newLead.label || '',
        status: newLead.status || 'pending',
        company: newLead.company.trim() || '',
        country: newLead.country || '',
        stateProvince: newLead.stateProvince || '',
        city: newLead.city.trim() || '',
        internalNote: newLead.internalNote.trim() || '',
        source: 'admin',
        assignedTo: newLead.assignedTo || null  // Make sure this is included
      };

      console.log('Sending lead data to server:', leadData);

      const response = await fetch('http://localhost:5000/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
      });

      const result = await response.json();
      console.log('Server response:', result);

      if (response.ok) {
        useToastStore.getState().add({ type: 'success', message: 'Lead added successfully!' });

        // Refresh the leads list
        const leadsResponse = await fetch('http://localhost:5000/api/leads?limit=10');
        const leadsData = await leadsResponse.json();
        setAllLeads(leadsData.leads || leadsData || []);

        setShowAddLead(false);
        setNewLead({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          requirements: '',
          category: '',
          label: '',
          status: 'pending',
          company: '',
          country: '',
          stateProvince: '',
          city: '',
          internalNote: '',
          assignedTo: ''
        });
      } else {
        useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to add lead' });
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      useToastStore.getState().add({ type: 'error', message: 'Error adding lead: ' + error.message });
    }
  };

  // ✅ Also add handleUpdateLead function if not present
  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      if (!editingItem) return;

      const response = await fetch(`http://localhost:5000/api/leads/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLead)
      });

      const result = await response.json();

      if (response.ok) {
        useToastStore.getState().add({ type: 'success', message: 'Lead updated successfully!' });
        setAllLeads(prev => prev.map(lead =>
          lead._id === editingItem._id ? (result.lead || result) : lead
        ));
        setShowAddLead(false);
        setEditingItem(null);
        setNewLead({
          name: '',
          email: '',
          phone: '',
          source: 'website',
          propertyInterest: '',
          status: 'new'
        });
      } else {
        useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to update lead' });
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      useToastStore.getState().add({ type: 'error', message: 'Error updating lead: ' + error.message });
    }
  };

  // ✅ Also make sure you have the handleEditItem function for leads:
  // Update your existing handleEditItem function to include lead handling:
  const handleEditItem = (item, type) => {
    setEditingItem({ ...item, type });
    if (type === 'user') {
      setNewUser({
        name: item.name,
        email: item.email,
        role: item.role,
        phone: item.phone || '',
        company: item.company || '',
        licenseNumber: item.licenseNumber || '',
        commissionRate: item.commissionRate || '',
        address: {
          street: item.address?.street || '',
          city: item.address?.city || '',
          state: item.address?.state || '',
          country: item.address?.country || '',
          zipCode: item.address?.zipCode || ''
        },
        membership: item.membership || item.agentInfo?.membership || { program: 'Realizty', plan: '', leadsPerMonth: 0 },
        password: '' // Don't show existing password
      });
      setShowAddUser(true);
    } else if (type === 'client') {
      setNewClient({
        name: item.name,
        email: item.email,
        phone: item.phone,
        company: item.company || '',
        status: item.status || 'active',
        password: '' // Always include password field for controlled input
      });
      setShowAddClient(true);
    }
    // In the handleEditItem function:
    else if (type === 'lead') {
      // Support leads that may have either `name` or `firstName`/`lastName`
      const displayName = getLeadDisplayName(item);
      const nameParts = displayName ? displayName.split(' ') : ['', ''];

      setNewLead({
        firstName: item.firstName || nameParts[0] || '',
        lastName: item.lastName || nameParts.slice(1).join(' ') || '',
        email: item.email || '',
        phone: item.phone || '',
        requirements: item.requirements || '',
        category: item.category || '',
        label: item.label || '',
        status: item.status || 'pending',
        company: item.company || '',
        country: item.country || '',
        stateProvince: item.stateProvince || '',
        city: item.city || '',
        internalNote: item.internalNote || item.notes || ''
      });
      setShowAddLead(true);
    } else if (type === 'property') {
      setNewProperty({
        title: item.title,
        location: item.location,
        price: item.price,
        status: item.status,
        owner: item.owner?.name || '',
        images: item.images || ['']
      });
      setEditingProperty(item);
      // Ensure editingItem is set so handleUpdateItem picks up property updates
      setEditingItem({ _id: item._id, type: 'property' });
      setShowAddProperty(true);
    }
  };

  // ✅ Update your handleUpdateItem function to include lead handling:
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem.type === 'user') {
        const response = await fetch(`http://localhost:5000/api/admin/users/${editingItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUser)
        });

        const result = await response.json();

        if (response.ok) {
          useToastStore.getState().add({ type: 'success', message: 'User updated successfully!' });
          setAllUsers(prev => prev.map(user =>
            user._id === editingItem._id ? result.user : user
          ));
          if (newUser.role === 'client') {
            setAllClients(prev => prev.map(client =>
              client._id === editingItem._id ? result.user : client
            ));
          }
        } else {
          useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to update user' });
        }
      } else if (editingItem.type === 'client') {
        const response = await fetch(`http://localhost:5000/api/admin/users/${editingItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newClient,
            role: 'client'
          })
        });

        const result = await response.json();

        if (response.ok) {
          useToastStore.getState().add({ type: 'success', message: 'Client updated successfully!' });
          setAllClients(prev => prev.map(client =>
            client._id === editingItem._id ? result.user : client
          ));
          setAllUsers(prev => prev.map(user =>
            user._id === editingItem._id ? result.user : user
          ));
        } else {
          useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to update client' });
        }
      } else if (editingItem.type === 'lead') {
        const response = await fetch(`http://localhost:5000/api/leads/${editingItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newLead)
        });

        const result = await response.json();

        if (response.ok) {
          useToastStore.getState().add({ type: 'success', message: 'Lead updated successfully!' });
          setAllLeads(prev => prev.map(lead =>
            lead._id === editingItem._id ? result.lead : lead
          ));
        } else {
          useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to update lead' });
        }
      } else if (editingItem.type === 'property') {
        const response = await fetch(`http://localhost:5000/api/admin/properties/${editingItem._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProperty)
        });

        const result = await response.json();

        if (response.ok) {
          useToastStore.getState().add({ type: 'success', message: 'Property updated successfully!' });
          setAllProperties(prev => prev.map(property =>
            property._id === editingItem._id ? result.property : property
          ));
        } else {
          useToastStore.getState().add({ type: 'error', message: result.message || 'Failed to update property' });
        }
      }
    } catch (error) {
      console.error('Error updating item:', error);
      useToastStore.getState().add({ type: 'error', message: 'Error updating item: ' + error.message });
    }

    setEditingItem(null);
    setShowAddUser(false);
    setShowAddClient(false);
    setShowAddLead(false);
    setShowAddProperty(false);
  };

  const handleRefresh = () => {
    refreshAllData();
  };

  // Stats Cards
  const statsCards = [
    {
      title: 'Total Properties',
      value: stats.totalProperties?.toLocaleString() || '0',
      change: `${stats.monthlyGrowth > 0 ? '+' : ''}${stats.monthlyGrowth || 0}%`,
      icon: <FiHome />,
      color: 'blue',
      trend: stats.monthlyGrowth > 0 ? 'up' : 'down'
    },
    {
      title: 'Total Clients',
      value: stats.totalClients?.toLocaleString() || '0',
      change: '+15%',
      icon: <FiUsers />,
      color: 'green',
      trend: 'up'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingProperties?.toLocaleString() || '0',
      change: `${pendingProperties.length} waiting`,
      icon: <FiTarget />,
      color: 'orange',
      trend: 'neutral'
    },

    {
      title: 'Leads This Week',
      value: leadsWeekCount?.toLocaleString() || '0',
      change: '',
      icon: <FiTrendingUp />,
      color: 'green',
      trend: 'neutral'
    },
    {
      title: 'Leads This Month',
      value: leadsMonthCount?.toLocaleString() || '0',
      change: '',
      icon: <FiTrendingUp />,
      color: 'purple',
      trend: 'neutral'
    }
  ];

  // Navigation tabs for different sections
  const sectionTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiHome /> },
    { id: 'properties', label: 'Properties', icon: <FiGrid /> },
    { id: 'users', label: 'Users', icon: <FiUser /> },
    { id: 'leads', label: 'Leads', icon: <FiTrendingUp /> },
    { id: 'Discount', label: 'Discount', icon: <FiCreditCard /> },
    { id: 'inquiries', label: 'Inquiries', icon: <FiMessageSquare /> },

  ];

  if (isLoading && refreshKey === 0) {
    return (
      <div className="flex bg-[#101624] min-h-screen">
        <main className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
          <div className="text-white text-xl">Loading dashboard data...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex bg-[#101624] min-h-screen">
      {/* Left Sidebar Navigation */}
      <div className="w-20 bg-[#181C2A] min-h-screen flex flex-col items-center py-6 border-r border-gray-800">
        <div className="mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-[#2c43f5] to-[#0519ad] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
        </div>
        <nav className="flex-1 flex flex-col items-center space-y-6">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`p-3 rounded-lg transition-all duration-300 ${activeSection === tab.id
                ? 'bg-[#2c43f5] text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              title={tab.label}
            >
              <span className="text-xl">{tab.icon}</span>
            </button>
          ))}
        </nav>
        <div className="mt-6">
          <button
            onClick={() => {
              try {
                const { logout } = useAuthStore.getState ? useAuthStore.getState() : useAuthStore();
                if (typeof logout === 'function') return logout();
              } catch (err) { }
              window.location.href = '/signin';
            }}
            title="Logout"
            className="p-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <FiLogOut className="text-xl" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'properties' && 'Properties Management'}
                {activeSection === 'users' && 'Users Management'}
                {activeSection === 'clients' && 'Clients Management'}
                {activeSection === 'leads' && 'Leads Management'}
                {activeSection === 'Discount' && 'Discounts'}

            </h1>
            <p className="text-gray-400">
              {activeSection === 'dashboard' && 'Monitor your platform\'s performance'}
              {activeSection === 'properties' && 'Manage all properties on the platform'}
              {activeSection === 'users' && 'Manage user accounts and permissions'}
              {activeSection === 'clients' && 'Manage client information and status'}
              {activeSection === 'leads' && 'Track and manage all leads'}
              {activeSection === 'Discount' && 'Create and manage discount coupons'}

            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#181C2A] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5] w-64"
              />
            </div>

            <button
              onClick={handleRefresh}
              className="bg-[#2c43f5] text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition disabled:opacity-50"
              disabled={isLoading}
            >
              <FiRefreshCw className={`${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* DASHBOARD SECTION */}
        {activeSection === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsCards.map((stat, index) => (
                <div key={index} className="bg-[#181C2A] rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                      <div className="flex items-center mt-1">
                        <span className={`text-sm ${stat.change.startsWith('+') ? 'text-green-400' :
                          stat.change.includes('waiting') ? 'text-orange-400' : 'text-red-400'
                          }`}>
                          {stat.change}
                        </span>
                        {stat.trend === 'up' && (
                          <FiTrendingUp className="ml-2 text-green-400" />
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                      stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                        stat.color === 'purple' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Leads Overview (Weekly / Monthly) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-4">Leads This Week</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsWeekData}>
                      <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <Tooltip wrapperStyle={{ backgroundColor: '#0f1724', borderRadius: 6 }} />
                      <Bar dataKey="count" fill="#2c43f5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-4">Leads This Month</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsMonthData}>
                      <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                      <Tooltip wrapperStyle={{ backgroundColor: '#0f1724', borderRadius: 6 }} />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Agent Lead Suggestions */}
            <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg border border-gray-800 mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Agent Lead Suggestions</h2>
                  <p className="text-gray-400 text-sm">Shows suggested leads per month by plan and current assigned count</p>
                </div>
                <button
                  onClick={fetchDashboardData}
                  className="bg-[#2c43f5] text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
                >Refresh</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(agents || []).length === 0 && (
                  <div className="col-span-full text-gray-400">No agents found.</div>
                )}
                {(agents || []).map(agent => {
                  const membership = (agent.agentInfo && agent.agentInfo.membership) || agent.membership || { program: 'Realizty', plan: '', leadsPerMonth: 0 };
                  const suggested = membership.leadsPerMonth || 0;
                  const assigned = agentAssignedMap[String(agent._id)] || 0;
                  const remaining = Math.max(suggested - assigned, 0);
                  return (
                    <div key={agent._id} className="bg-[#0b1220] p-4 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <button
                            type="button"
                            onClick={() => openAgentModal(agent._id)}
                            className="text-white font-semibold hover:underline"
                          >
                            {agent.name || agent.email}
                          </button>
                          <div className="text-gray-400 text-sm">{agent.email}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-gray-400">Plan</div>
                          <div className="text-white">{membership.plan || '—'}</div>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-400">Suggested: <span className="text-white">{suggested}</span> leads / month</div>
                      <div className="mt-1 text-sm text-gray-400">Assigned: <span className="text-white">{assigned}</span></div>
                      <div className="mt-2 text-sm">
                        <div className="text-gray-400">Remaining quota: <span className="text-white">{remaining}</span></div>
                        <div className="w-full bg-gray-800 h-2 rounded mt-2">
                          <div className="bg-green-500 h-2 rounded" style={{ width: `${suggested === 0 ? 0 : Math.min(100, (assigned / suggested) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Properties Status Chart */}
              <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg border border-gray-800">
                <h2 className="text-xl font-bold text-white mb-6">Properties Status</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertiesStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry?.name || 'Unknown'}: ${entry?.value ?? 0}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {propertiesStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        labelStyle={{ color: '#CBD5E1', fontWeight: 'bold' }}
                        formatter={(value, name) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>


            </div>

            {/* Pending Properties Section */}
            {pendingProperties.length > 0 && (
              <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg mb-8 border border-gray-800">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Pending Property Approvals</h2>
                    <p className="text-gray-400 text-sm mt-1">Properties waiting for review</p>
                  </div>
                  <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {pendingProperties.length} Pending
                  </span>
                </div>
                <div className="space-y-4">
                  {pendingProperties.map((property) => (
                    <div key={property._id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                          <div className="w-full h-full object-cover bg-gray-700 flex items-center justify-center">
                            {property.images?.[0] ? (
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                      <circle cx="8.5" cy="8.5" r="1.5"/>
                                      <polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                  `;
                                }}
                              />
                            ) : (
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{property.title || 'Untitled Property'}</h4>
                          <p className="text-gray-400 text-sm">{property.location || 'No location specified'}</p>
                          <p className="text-gray-400 text-sm">By: {property.owner?.name || 'Unknown'}</p>
                          {property.price && (
                            <p className="text-green-400 text-sm font-medium mt-1">${property.price.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => { setModalProperty(normalizeProperty(property)); setShowPropertyView(true); }}
                          className="bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition"
                          title="View"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handlePropertyAction(property._id, 'approve')}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                        >
                          <FiCheck />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handlePropertyAction(property._id, 'reject')}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                        >
                          <FiX />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* DISCOUNT SECTION */}
        {activeSection === 'Discount' && (
          <div>
            <DiscountsPage />
          </div>
        )}
        {/* Property View Modal */}
        {showPropertyView && modalProperty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-60" onClick={() => { setShowPropertyView(false); setModalProperty(null); }}></div>
            <div className="relative bg-[#071023] text-white w-11/12 md:w-4/5 lg:w-3/4 p-0 rounded-lg shadow-2xl z-10 overflow-hidden max-h-[90vh]">
              {/* Header image */}
              <div className="relative h-56 w-full bg-gray-700">
                {Array.isArray(modalProperty.images) && modalProperty.images[0] ? (
                  <img src={modalProperty.images[0]} alt={modalProperty.title} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute left-6 bottom-4">
                  <h3 className="text-2xl font-bold">{modalProperty.title}</h3>
                  <div className="mt-1 text-sm text-gray-300">{modalProperty.location || modalProperty.city || 'Location not set'}</div>
                </div>
                <button className="absolute right-4 top-4 text-gray-200 bg-black/30 px-3 py-2 rounded" onClick={() => { setShowPropertyView(false); setModalProperty(null); }}>Close</button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-3xl font-extrabold text-white">${modalProperty.price ?? 0}</div>
                      <div className="text-sm text-gray-400">{modalProperty.status ? modalProperty.status.toUpperCase() : 'N/A'}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="px-4 py-2 bg-[#2c43f5] rounded text-white" onClick={() => { setShowPropertyView(false); handleEditItem(modalProperty, 'property'); }}>Edit</button>
                      <button className="px-4 py-2 bg-gray-700 rounded text-white" onClick={() => { setShowPropertyView(false); setModalProperty(null); }}>Close</button>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-4">{modalProperty.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#08111a] p-4 rounded">
                      <div className="text-xs text-gray-400">Type</div>
                      <div className="text-sm text-white">{modalProperty.propertyType || modalProperty.type || '—'}</div>
                    </div>
                    <div className="bg-[#08111a] p-4 rounded">
                      <div className="text-xs text-gray-400">Beds / Baths</div>
                      <div className="text-sm text-white">{modalProperty.bedrooms || 0} bd / {modalProperty.bathrooms || 0} ba</div>
                    </div>
                    <div className="bg-[#08111a] p-4 rounded">
                      <div className="text-xs text-gray-400">Area</div>
                      <div className="text-sm text-white">{modalProperty.squareFeet || modalProperty.area || '—'}</div>
                    </div>
                    <div className="bg-[#08111a] p-4 rounded">
                      <div className="text-xs text-gray-400">Listing</div>
                      <div className="text-sm text-white">{modalProperty.listingType || '—'}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm text-gray-300 mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {(modalProperty.features && Array.isArray(modalProperty.features) ? modalProperty.features : []).length > 0 ? (
                        (modalProperty.features || []).map((f, i) => (
                          <span key={i} className="text-xs bg-gray-800 text-gray-200 px-3 py-1 rounded">{String(f)}</span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">No features listed</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    {modalProperty.status === 'pending' && (
                      <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-green-600 rounded flex items-center space-x-2" onClick={async () => { await handlePropertyAction(modalProperty._id, 'approve'); setShowPropertyView(false); setModalProperty(null); }}><FiCheck /> <span>Approve</span></button>
                        <button className="px-4 py-2 bg-red-600 rounded flex items-center space-x-2" onClick={async () => { await handlePropertyAction(modalProperty._id, 'reject'); setShowPropertyView(false); setModalProperty(null); }}><FiX /> <span>Reject</span></button>
                      </div>
                    )}
                  </div>
                </div>

                <aside className="space-y-4">
                  <div className="bg-[#08111a] p-4 rounded">
                    <div className="text-xs text-gray-400">Owner</div>
                    <div className="flex items-center mt-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2c43f5] to-[#0519ad] flex items-center justify-center text-white font-bold">{modalProperty.owner?.name?.charAt(0) || 'U'}</div>
                      <div className="ml-3">
                        <div className="text-sm text-white">{modalProperty.owner?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400">{modalProperty.owner?.email || 'No email'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#08111a] p-4 rounded">
                    <div className="text-xs text-gray-400">Created</div>
                    <div className="text-sm text-white mt-1">{modalProperty.createdAt ? new Date(modalProperty.createdAt).toLocaleString() : 'N/A'}</div>
                  </div>

                  <div className="bg-[#08111a] p-4 rounded">
                    <div className="text-xs text-gray-400">City</div>
                    <div className="text-sm text-white mt-1">{modalProperty.city || modalProperty.location || '—'}</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button className="w-full mr-2 px-4 py-2 bg-red-700 rounded" onClick={() => {
                      confirmCallbackRef.current = async () => { await handleDeleteProperty(modalProperty._id); setShowPropertyView(false); setModalProperty(null); };
                      setConfirmMessage('Delete this property? This action cannot be undone.');
                      setShowConfirm(true);
                    }}>Delete</button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Property Modal */}
        {showAddProperty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-60" onClick={() => { setShowAddProperty(false); setEditingItem(null); }}></div>
            <div className="relative bg-[#0f1724] text-white w-11/12 md:w-3/4 lg:w-1/2 p-6 rounded-lg shadow-lg z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{editingItem && editingItem.type === 'property' ? 'Edit Property' : 'Add Property'}</h3>
                <button className="text-gray-300 hover:text-white" onClick={() => { setShowAddProperty(false); setEditingItem(null); }}>Close</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (editingItem && editingItem.type === 'property') {
                    const res = await fetch(`http://localhost:5000/api/admin/properties/${editingItem._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newProperty)
                    });
                    const json = await res.json();
                    if (res.ok) {
                      useToastStore.getState().add({ type: 'success', message: 'Property updated successfully!' });
                      setAllProperties(prev => prev.map(p => p._id === json.property._id ? json.property : p));
                    } else {
                      useToastStore.getState().add({ type: 'error', message: json.message || 'Failed to update property' });
                    }
                  } else {
                    const res = await fetch('http://localhost:5000/api/admin/properties', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newProperty)
                    });
                    const json = await res.json();
                    if (res.ok) {
                      useToastStore.getState().add({ type: 'success', message: 'Property created successfully!' });
                      setAllProperties(prev => [json.property, ...prev]);
                    } else {
                      useToastStore.getState().add({ type: 'error', message: json.message || 'Failed to create property' });
                    }
                  }
                } catch (err) {
                  console.error('Error saving property', err);
                  useToastStore.getState().add({ type: 'error', message: 'Error saving property' });
                }
                setShowAddProperty(false);
                setEditingItem(null);
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Title</label>
                    <input className="w-full bg-gray-700 text-white px-4 py-2 rounded" value={newProperty.title} onChange={e => setNewProperty({ ...newProperty, title: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Price</label>
                    <input type="number" className="w-full bg-gray-700 text-white px-4 py-2 rounded" value={newProperty.price} onChange={e => setNewProperty({ ...newProperty, price: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Location</label>
                    <input className="w-full bg-gray-700 text-white px-4 py-2 rounded" value={newProperty.location} onChange={e => setNewProperty({ ...newProperty, location: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Status</label>
                    <select className="w-full bg-gray-700 text-white px-4 py-2 rounded" value={newProperty.status || 'pending'} onChange={e => setNewProperty({ ...newProperty, status: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="published">Published</option>
                      <option value="sold">Sold</option>
                      <option value="rented">Rented</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 mb-2">Description</label>
                    <textarea className="w-full bg-gray-700 text-white px-4 py-2 rounded" rows="4" value={newProperty.description || ''} onChange={e => setNewProperty({ ...newProperty, description: e.target.value })}></textarea>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button type="button" className="px-4 py-2 text-gray-400" onClick={() => { setShowAddProperty(false); setEditingItem(null); }}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#2c43f5] rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PROPERTIES MANAGEMENT SECTION */}
        {activeSection === 'properties' && (
          <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">All Properties</h2>
              <div className="flex space-x-4">
                <button
                  onClick={refreshAllData}
                  className="bg-[#2c43f5] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                >
                  <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <select
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg"
                  onChange={(e) => {
                    const status = e.target.value;
                    if (status === 'all') {
                      refreshAllData();
                    } else {
                      // Filter locally
                      const filtered = allProperties.filter(p => p.status === status);
                      setAllProperties(filtered);
                    }
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Property</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Location</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Price</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Owner</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allProperties.map((property) => (
                    <tr key={property._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 flex items-center justify-center">
                            {property.images?.[0] ? (
                              <img
                                src={property.images[0]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                      <circle cx="8.5" cy="8.5" r="1.5"/>
                                      <polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                  `;
                                }}
                              />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{property.title}</p>
                            <p className="text-gray-400 text-sm">ID: {property._id?.slice(-6) || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FiMapPin className="text-gray-400" />
                          <span className="text-white">{property.location}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-green-400 font-medium">${property.price?.toLocaleString() || '0'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${property.status === 'published' ? 'bg-green-500/20 text-green-400' :
                          property.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                            property.status === 'sold' ? 'bg-blue-500/20 text-blue-400' :
                              property.status === 'rented' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-red-500/20 text-red-400'
                          }`}>
                          {property.status?.charAt(0).toUpperCase() + property.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FiUser className="text-gray-400" />
                          <span className="text-white">{property.owner?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => { setModalProperty(normalizeProperty(property)); setShowPropertyView(true); }}
                            className="bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition"
                            title="View"
                          >
                            <FiEye />
                          </button>
                          {property.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handlePropertyAction(property._id, 'approve')}
                                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"
                                title="Approve"
                              >
                                <FiCheck />
                              </button>
                              <button
                                onClick={() => handlePropertyAction(property._id, 'reject')}
                                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                                title="Reject"
                              >
                                <FiX />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEditItem(property, 'property')}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(property._id)}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS MANAGEMENT SECTION */}
        {activeSection === 'users' && (
          <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Users Management</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setNewUser({
                    name: '',
                    email: '',
                    password: '',
                    role: 'user',
                    phone: '',
                    company: '',
                    licenseNumber: '',
                    commissionRate: '',
                    membership: { program: 'Realizty', plan: '', leadsPerMonth: 0 }
                  });
                  setShowAddUser(true);
                }}
                className="bg-[#2c43f5] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
              >
                <FiPlus />
                <span>Add User</span>
              </button>
            </div>

            {/* Add/Edit User Form */}
            {showAddUser && (
              <div className="mb-6 bg-gray-800/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  {editingItem ? 'Edit User' : 'Add New User'}
                </h3>
                <form onSubmit={editingItem ? handleUpdateItem : handleAddUser}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Role</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => {
                          const role = e.target.value;
                          setNewUser({
                            ...newUser,
                            role,
                            // Clear role-specific fields when role changes
                            company: role === 'client' ? newUser.company : '',
                            licenseNumber: role === 'agent' ? newUser.licenseNumber : '',
                            commissionRate: role === 'agent' ? newUser.commissionRate : ''
                          });
                        }}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      >
                        <option value="user">Regular User</option>
                        <option value="client">Client</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">Password</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        required={!editingItem}
                        placeholder={editingItem ? "Leave blank to keep current" : ""}
                      />
                    </div>

                    {/* Show client-specific fields */}
                    {newUser.role === 'client' && (
                      <div className="md:col-span-2">
                        <label className="block text-gray-400 mb-2">Company (Optional)</label>
                        <input
                          type="text"
                          value={newUser.company || ''}
                          onChange={(e) => setNewUser({ ...newUser, company: e.target.value })}
                          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                          placeholder="Company name"
                        />
                      </div>
                    )}

                    {/* Show agent-specific fields */}
                    {newUser.role === 'agent' && (
                      <>
                        <div>
                          <label className="block text-gray-400 mb-2">License Number</label>
                          <input
                            type="text"
                            value={newUser.licenseNumber || ''}
                            onChange={(e) => setNewUser({ ...newUser, licenseNumber: e.target.value })}
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                            placeholder="Agent license number"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-2">Commission Rate (%)</label>
                          <input
                            type="number"
                            value={newUser.commissionRate || ''}
                            onChange={(e) => setNewUser({ ...newUser, commissionRate: e.target.value })}
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                            placeholder="e.g., 5"
                            min="0"
                            max="100"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-2">Agent Address - Country</label>
                          <input
                            type="text"
                            value={newUser.address?.country || ''}
                            onChange={(e) => setNewUser({ ...newUser, address: { ...newUser.address, country: e.target.value } })}
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                            placeholder="Country"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-2">Agent Address - State / Province</label>
                          <input
                            type="text"
                            value={newUser.address?.state || ''}
                            onChange={(e) => setNewUser({ ...newUser, address: { ...newUser.address, state: e.target.value } })}
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                            placeholder="State / Province"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-2">Agent Address - City</label>
                          <input
                            type="text"
                            value={newUser.address?.city || ''}
                            onChange={(e) => setNewUser({ ...newUser, address: { ...newUser.address, city: e.target.value } })}
                            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                            placeholder="City"
                          />
                        </div>
                        {/* Membership card for agents */}
                        <div className="md:col-span-2 bg-[#0b1220] p-4 rounded-lg border border-gray-700 mt-2">
                          <h4 className="text-white font-semibold mb-3">Membership</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-gray-400 mb-2">Program</label>
                              <select
                                value={newUser.membership?.program || 'Realizty'}
                                onChange={(e) => setNewUser({ ...newUser, membership: { ...newUser.membership, program: e.target.value } })}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                              >
                                <option value="Realizty">Realizty</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">Plan</label>
                              <select
                                value={newUser.membership?.plan || ''}
                                onChange={(e) => {
                                  const plan = e.target.value;
                                  const planMap = { Essential: 1, Accelerate: 2, Priority: 3, Prestige: 4 };
                                  const leads = planMap[plan] || 0;
                                  setNewUser({ ...newUser, membership: { ...newUser.membership, plan, leadsPerMonth: leads } });
                                }}
                                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                              >
                                <option value="">Select plan</option>
                                <option value="Essential">Essential : 1</option>
                                <option value="Accelerate">Accelerate : 2</option>
                                <option value="Priority">Priority : 3</option>
                                <option value="Prestige">Prestige : 4</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-400 mb-2">Suggested leads / month</label>
                              <div className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg">{newUser.membership?.leadsPerMonth || 0}</div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400 mt-3">Suggestion: You should assign <strong className="text-white">{newUser.membership?.leadsPerMonth || 0}</strong> leads per month to this agent based on the selected plan.</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddUser(false);
                        setEditingItem(null);
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      {editingItem ? 'Update User' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Plan</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2c43f5] to-[#0519ad] flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-gray-400 text-sm">{user.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FiMail className="text-gray-400" />
                          <span className="text-white">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                          user.role === 'agent' ? 'bg-blue-500/20 text-blue-400' :
                            user.role === 'client' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                          }`}>
                          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.role === 'agent' ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-white">{(user.membership && user.membership.plan) || (user.agentInfo?.membership && user.agentInfo.membership.plan) || '—'}</span>
                            <span className="text-xs text-gray-400">{((user.membership && user.membership.leadsPerMonth) || (user.agentInfo?.membership && user.agentInfo.membership.leadsPerMonth) || 0)} / month</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="text-gray-400" />
                          <span className="text-white">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditItem(user, 'user')}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEADS MANAGEMENT SECTION */}
        {activeSection === 'leads' && (
          <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Leads Management</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setNewLead({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      requirements: '',
                      category: '',
                      label: '',
                      status: 'pending',
                      company: '',
                      country: '',
                      stateProvince: '',
                      city: '',
                      internalNote: '',
                      assignedTo: ''
                    });
                    setShowAddLead(true);
                  }}
                  className="bg-[#2c43f5] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center space-x-2"
                >
                  <FiPlus />
                  <span>Add Lead</span>
                </button>
                <select className="bg-gray-800 text-white px-4 py-2 rounded-lg" value={''} onChange={(e) => {/* filter handler can be wired here */ }}>
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_process">In Process</option>
                  <option value="closed">Closed</option>
                  <option value="rejected">Rejected</option>
                  <option value="non-viable">Non-viable</option>
                </select>
              </div>
            </div>

            {/* Add/Edit Lead Form */}
            {showAddLead && (
              <div className="mb-6 bg-gray-800/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  {editingItem ? 'Edit Lead' : 'Add New Lead'}
                </h3>
                <form onSubmit={editingItem ? handleUpdateItem : handleAddLead}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <h4 className="text-lg font-bold text-white md:col-span-2">Lead Information</h4>

                    <div>
                      <label className="block text-gray-400 mb-2">FIRST NAME</label>
                      <input
                        type="text"
                        value={newLead.firstName}
                        onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">LAST NAME</label>
                      <input
                        type="text"
                        value={newLead.lastName}
                        onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-2">ASSIGN TO AGENT</label>
                      <select
                        value={newLead.assignedTo || ''}
                        onChange={(e) => {
                          const agentId = e.target.value;
                          // find agent and copy location into lead fields
                          const agent = agents.find(a => a && (String(a._id) === String(agentId) || String(a.id) === String(agentId)));
                          setNewLead({
                            ...newLead,
                            assignedTo: agentId,
                            city: agent?.address?.city || agent?.city || '',
                            stateProvince: agent?.address?.state || agent?.address?.stateProvince || agent?.state || '',
                            country: agent?.address?.country || agent?.country || ''
                          });
                        }}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      >
                        <option value="">Select agent (Optional)</option>
                        {Array.isArray(agents)
                          ? agents.filter(Boolean).map(agent => (
                            <option key={String(agent._id)} value={String(agent._id)}>
                              {agent?.name || 'Unnamed'} ({agent?.email || 'no-email'})
                              {agent?.address?.city ? ` - ${agent?.address?.city}` : ''}
                            </option>
                          ))
                          : null}
                      </select>
                      {/* Show selected agent location for context */}
                      {newLead.assignedTo && (
                        <div className="mt-2 text-sm text-gray-300">
                          <strong>Agent location:</strong>
                          <span className="ml-2">{getAgentLocation(newLead.assignedTo) || 'Location not available'}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">EMAIL</label>
                      <input
                        type="email"
                        value={newLead.email}
                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">PHONE</label>
                      <input
                        type="tel"
                        value={newLead.phone}
                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">REQUIREMENTS</label>
                      <textarea
                        value={newLead.requirements}
                        onChange={(e) => setNewLead({ ...newLead, requirements: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        rows="3"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">CATEGORY</label>
                      <select
                        value={newLead.category || ''}
                        onChange={(e) => setNewLead({ ...newLead, category: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      >
                        <option value="">Select category</option>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="rental">Rental</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">LABEL</label>
                      <select
                        value={newLead.label || ''}
                        onChange={(e) => setNewLead({ ...newLead, label: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      >
                        <option value="">Select label</option>
                        <option value="fresh">Fresh</option>
                        <option value="recycle">Recycle</option>
                        <option value="duplicate">Duplicate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">STATUS</label>
                      <select
                        value={newLead.status || 'pending'}
                        onChange={(e) => setNewLead({ ...newLead, status: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="in_process">In Process</option>
                        <option value="closed">Closed</option>
                        <option value="rejected">Rejected</option>
                        <option value="non-viable">Non-viable</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <h4 className="text-lg font-bold text-white md:col-span-2">Address</h4>

                    <div>
                      <label className="block text-gray-400 mb-2">COMPANY</label>
                      <input
                        type="text"
                        value={newLead.company}
                        onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">COUNTRY</label>
                      <select
                        value={newLead.country}
                        onChange={(e) => {
                          setNewLead({
                            ...newLead,
                            country: e.target.value,
                            stateProvince: '' // Reset state when country changes
                          });
                        }}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      >
                        <option value="">Select country</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">STATE/PROVINCE</label>
                      <select
                        value={newLead.stateProvince}
                        onChange={(e) => setNewLead({ ...newLead, stateProvince: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                        disabled={!newLead.country}
                      >
                        <option value="">Select state/province</option>
                        {newLead.country === 'United States' && (
                          <>
                            <option value="AL">Alabama</option>
                            <option value="AK">Alaska</option>
                            <option value="AZ">Arizona</option>
                            <option value="AR">Arkansas</option>
                            <option value="CA">California</option>
                            <option value="CO">Colorado</option>
                            <option value="CT">Connecticut</option>
                            <option value="DE">Delaware</option>
                            <option value="FL">Florida</option>
                            <option value="GA">Georgia</option>
                            <option value="HI">Hawaii</option>
                            <option value="ID">Idaho</option>
                            <option value="IL">Illinois</option>
                            <option value="IN">Indiana</option>
                            <option value="IA">Iowa</option>
                            <option value="KS">Kansas</option>
                            <option value="KY">Kentucky</option>
                            <option value="LA">Louisiana</option>
                            <option value="ME">Maine</option>
                            <option value="MD">Maryland</option>
                            <option value="MA">Massachusetts</option>
                            <option value="MI">Michigan</option>
                            <option value="MN">Minnesota</option>
                            <option value="MS">Mississippi</option>
                            <option value="MO">Missouri</option>
                            <option value="MT">Montana</option>
                            <option value="NE">Nebraska</option>
                            <option value="NV">Nevada</option>
                            <option value="NH">New Hampshire</option>
                            <option value="NJ">New Jersey</option>
                            <option value="NM">New Mexico</option>
                            <option value="NY">New York</option>
                            <option value="NC">North Carolina</option>
                            <option value="ND">North Dakota</option>
                            <option value="OH">Ohio</option>
                            <option value="OK">Oklahoma</option>
                            <option value="OR">Oregon</option>
                            <option value="PA">Pennsylvania</option>
                            <option value="RI">Rhode Island</option>
                            <option value="SC">South Carolina</option>
                            <option value="SD">South Dakota</option>
                            <option value="TN">Tennessee</option>
                            <option value="TX">Texas</option>
                            <option value="UT">Utah</option>
                            <option value="VT">Vermont</option>
                            <option value="VA">Virginia</option>
                            <option value="WA">Washington</option>
                            <option value="WV">West Virginia</option>
                            <option value="WI">Wisconsin</option>
                            <option value="WY">Wyoming</option>
                          </>
                        )}
                        {newLead.country === 'Canada' && (
                          <>
                            <option value="AB">Alberta</option>
                            <option value="BC">British Columbia</option>
                            <option value="MB">Manitoba</option>
                            <option value="NB">New Brunswick</option>
                            <option value="NL">Newfoundland and Labrador</option>
                            <option value="NS">Nova Scotia</option>
                            <option value="ON">Ontario</option>
                            <option value="PE">Prince Edward Island</option>
                            <option value="QC">Quebec</option>
                            <option value="SK">Saskatchewan</option>
                            <option value="NT">Northwest Territories</option>
                            <option value="NU">Nunavut</option>
                            <option value="YT">Yukon</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">CITY</label>
                      <input
                        type="text"
                        value={newLead.city}
                        onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                        className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-4">Internal Lead Note</h4>
                    <textarea
                      value={newLead.internalNote}
                      onChange={(e) => setNewLead({ ...newLead, internalNote: e.target.value })}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                      rows="4"
                      placeholder="Add a note"
                    />
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddLead(false);
                        setEditingItem(null);
                      }}
                      className="px-4 py-2 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#2c43f5] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                    >
                      {editingItem ? 'Update Lead' : 'Add Lead'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            {/* Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Lead</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Contact</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Assigned to</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">City</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">State</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Country</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Source</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allLeads.map((lead) => (
                    <tr key={lead._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                            <span className="text-white font-bold">
                              {getLeadDisplayName(lead)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{getLeadDisplayName(lead)}</p>
                            <p className="text-gray-400 text-sm">Lead</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <FiMail className="text-gray-400 text-sm" />
                            <span className="text-white text-sm">{lead.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiPhone className="text-gray-400 text-sm" />
                            <span className="text-white text-sm">{lead.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {(() => {
                          // try to extract agent id
                          const assigned = lead?.assignedTo;
                          const agentId = assigned?._id || assigned;
                          if (!agentId) return <span className="text-gray-400">—</span>;
                          return (
                            <button type="button" onClick={() => openAgentModal(agentId)} className="text-white text-sm hover:underline">
                              {getAssignedName(lead)}
                            </button>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-white text-sm">{lead.city || '—'}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-white text-sm">{lead.stateProvince || '—'}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-white text-sm">{lead.country || '—'}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${lead.source === 'website' ? 'bg-blue-500/20 text-blue-400' :
                          lead.source === 'phone' ? 'bg-green-500/20 text-green-400' :
                            lead.source === 'email' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-orange-500/20 text-orange-400'
                          }`}>
                          {lead.source?.charAt(0).toUpperCase() + lead.source?.slice(1)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                          lead.status === 'contacted' ? 'bg-orange-500/20 text-orange-400' :
                            lead.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                              'bg-red-500/20 text-red-400'
                          }`}>
                          {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditItem(lead, 'lead')}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead._id)}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeSection === 'inquiries' && (
          <ClientInquiriesSection />
        )}
      </main>

      {/* Global confirm modal for destructive actions */}
      {showConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)}></div>
          <div className="relative bg-[#0b1220] text-white w-full max-w-md p-6 rounded-lg shadow-2xl z-70">
            <h4 className="text-lg font-semibold mb-2">Confirm Action</h4>
            <p className="text-gray-300 mb-4">{confirmMessage}</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-600 rounded" onClick={() => { setShowConfirm(false); confirmCallbackRef.current = null; }}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 rounded" onClick={async () => { setShowConfirm(false); const cb = confirmCallbackRef.current; confirmCallbackRef.current = null; if (cb) await cb(); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Profile Modal */}
      {showAgentModal && selectedAgent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60" onClick={closeAgentModal}></div>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-[#05060a] text-white w-full max-w-3xl p-0 rounded-lg shadow-2xl z-70 overflow-auto max-h-[85vh]">
            <div className="p-6 border-b border-white/5 flex items-start gap-6">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-600 flex-shrink-0 shadow-lg">
                {selectedAgent.profileImageUrl ? (
                  <img src={selectedAgent.profileImageUrl} alt={selectedAgent.name || 'Agent'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-gray-700 to-gray-800">
                    <span className="text-2xl font-semibold">{(selectedAgent.name || selectedAgent.email || 'A').charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight">{selectedAgent.name || selectedAgent.email}</h3>
                    <p className="text-sm text-gray-300 mt-1">{selectedAgent.title || selectedAgent.role || 'Agent'} • <span className="text-blue-400">{selectedAgent.email}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={`tel:${selectedAgent.phone || ''}`} className="px-3 py-2 bg-white/6 hover:bg-white/10 rounded-lg text-sm flex items-center gap-2"><FiPhone /> Call</a>
                    <a href={`mailto:${selectedAgent.email || ''}`} className="px-3 py-2 bg-white/6 hover:bg-white/10 rounded-lg text-sm flex items-center gap-2"><FiMail /> Email</a>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="px-3 py-2 bg-white/5 rounded-lg text-sm">
                    <div className="text-xs text-gray-300">Leads</div>
                    <div className="text-lg font-semibold">{selectedAgent.assignedCount || (selectedAgent.leadsAssigned ? selectedAgent.leadsAssigned.length : 0)}</div>
                  </div>
                  <div className="px-3 py-2 bg-white/5 rounded-lg text-sm">
                    <div className="text-xs text-gray-300">Clients</div>
                    <div className="text-lg font-semibold">{selectedAgent.clientsAssigned ? selectedAgent.clientsAssigned.length : 0}</div>
                  </div>
                  <div className="px-3 py-2 bg-white/5 rounded-lg text-sm">
                    <div className="text-xs text-gray-300">Plan</div>
                    <div className="text-lg font-semibold">{(selectedAgent.agentInfo?.membership?.plan || selectedAgent.membership?.plan) || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="text-sm text-gray-300">Contact</div>
                <div className="bg-[#07101a] border border-white/5 rounded-lg p-4">
                  <div className="text-white font-medium">{selectedAgent.phone ? (<a href={`tel:${selectedAgent.phone}`} className="hover:underline">{selectedAgent.phone}</a>) : '—'}</div>
                  <div className="text-blue-400 text-sm mt-1">{selectedAgent.email ? (<a href={`mailto:${selectedAgent.email}`} className="hover:underline">{selectedAgent.email}</a>) : '—'}</div>
                  <div className="text-gray-400 text-sm mt-2">
                    {(() => {
                      const addr = selectedAgent.address || selectedAgent.agentInfo?.address || selectedAgent.location || {};
                      const parts = [addr.street, addr.city, addr.state || addr.stateProvince, addr.country, addr.zipCode].filter(Boolean);
                      return parts.length ? parts.join(', ') : '—';
                    })()}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold">Clients</h4>
                  {selectedAgent.clientsAssigned && selectedAgent.clientsAssigned.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {selectedAgent.clientsAssigned.map(c => (
                        <li key={c._id} className="p-3 bg-[#07101a] border border-white/6 rounded-lg hover:scale-[1.01] transition-transform">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium">{c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email}</div>
                              <div className="text-gray-400 text-sm">{c.email || ''}{c.phone ? ` · ${c.phone}` : ''}</div>
                            </div>
                            <div className="text-sm text-gray-400">{c.company || ''}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 mt-2">No clients assigned to this agent.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold">Leads</h4>
                  {selectedAgent.leadsAssigned && selectedAgent.leadsAssigned.length > 0 ? (
                    <ul className="mt-2 space-y-3">
                      {selectedAgent.leadsAssigned.map(lead => (
                        <li key={lead._id} className="p-3 bg-[#07101a] border border-white/6 rounded-lg hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-white font-medium">{(lead.firstName || lead.name) ? `${lead.firstName || ''} ${lead.lastName || lead.name || ''}`.trim() : lead.email || 'Unnamed Lead'}</div>
                              <div className="text-gray-400 text-sm mt-1">{lead.email || ''}{lead.phone ? ` · ${lead.phone}` : ''}</div>
                              <div className="text-gray-400 text-sm">{(lead.city || lead.stateProvince) ? `${lead.city || ''}${lead.city && lead.stateProvince ? ', ' : ''}${lead.stateProvince || ''}` : ''}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-300 mb-1">{lead.status || '-'}</div>
                              <div className="text-gray-400 text-xs">{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 mt-2">No leads assigned to this agent.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;