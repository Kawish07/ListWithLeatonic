// client/src/pages/AddPropertyPage.js - UPDATED
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axios from '../utils/api';
import PropertyForm from '../components/PropertyForm';
import LoadingSpinner from '../components/LoadingSpinner';

const AddPropertyPage = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/signin', { 
          state: { from: location.pathname },
          replace: true 
        });
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const handleSubmit = async (formData) => {
    try {
      console.log('Submitting property form...');
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Make sure FormData is properly constructed
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Send request WITHOUT /api prefix since baseURL already has it
      const response = await axios.post('/properties', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        alert('Property added successfully! It will be reviewed before publishing.');
        navigate('/user/properties');
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data.message || 'Failed to add property');
      }
    } catch (error) {
      console.error('Error adding property:', error);
      
      let errorMessage = 'Failed to add property';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  if (authLoading || isCheckingAuth) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Add New Property</h1>
          <p className="text-gray-600 mt-2">
            List your property to reach thousands of potential buyers and renters
          </p>
        </div>
        
        <PropertyForm 
          onSubmit={handleSubmit} 
          userId={user?.id} 
        />
      </div>
    </div>
  );
};

export default AddPropertyPage;