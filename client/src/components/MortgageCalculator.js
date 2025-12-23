import React, { useState, useEffect } from 'react';

const MortgageCalculator = ({ dark = false }) => {
  const [inputs, setInputs] = useState({
    zipCode: '94110',
    homePrice: 1171500,
    downPayment: 292875,
    interestRate: 6.6,
    loanType: '30',
    creditScore: '760-850',
    propertyTax: 9489,
    homeInsurance: 2050
  });

  const [results, setResults] = useState({
    monthlyPayment: 0,
    principalInterest: 0,
    propertyTaxes: 0,
    insurance: 0,
    downPaymentPercent: 0
  });

  useEffect(() => {
    calculateMortgage();
  }, [inputs]);

  const calculateMortgage = () => {
    const principal = inputs.homePrice - inputs.downPayment;
    const monthlyRate = inputs.interestRate / 100 / 12;
    const numberOfPayments = parseInt(inputs.loanType) * 12;

    // Calculate monthly principal & interest
    const x = Math.pow(1 + monthlyRate, numberOfPayments);
    const monthlyPrincipalInterest = (principal * monthlyRate * x) / (x - 1);

    // Calculate monthly property taxes and insurance
    const monthlyPropertyTax = inputs.propertyTax / 12;
    const monthlyInsurance = inputs.homeInsurance / 12;

    // Total monthly payment
    const totalMonthly = monthlyPrincipalInterest + monthlyPropertyTax + monthlyInsurance;

    // Down payment percentage
    const downPaymentPercent = (inputs.downPayment / inputs.homePrice) * 100;

    setResults({
      monthlyPayment: totalMonthly,
      principalInterest: monthlyPrincipalInterest,
      propertyTaxes: monthlyPropertyTax,
      insurance: monthlyInsurance,
      downPaymentPercent: downPaymentPercent
    });
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const propertyTaxPercent = ((inputs.propertyTax / inputs.homePrice) * 100).toFixed(2);

  return (
    <div className={`w-full ${dark ? 'bg-gray-900' : 'bg-transparent'} rounded-3xl p-8 md:p-12`}>
      <h2 className={`text-5xl md:text-7xl font-bold text-center mb-12 ${dark ? 'text-white' : 'text-[#141414]'}`}>
        Mortgage Calculator
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          {/* ZIP Code */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              ZIP Code
            </label>
            <input
              type="text"
              value={inputs.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                dark 
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none transition-colors`}
            />
          </div>

          {/* Down Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Down Payment
              </label>
              <div className="relative">
                <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  $
                </span>
                <input
                  type="number"
                  value={inputs.downPayment}
                  onChange={(e) => handleInputChange('downPayment', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                    dark 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none transition-colors`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Percent Down
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={results.downPaymentPercent.toFixed(0)}
                  onChange={(e) => {
                    const percent = parseFloat(e.target.value) || 0;
                    const newDownPayment = (inputs.homePrice * percent) / 100;
                    handleInputChange('downPayment', newDownPayment);
                  }}
                  className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                    dark 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none transition-colors`}
                />
                <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-lg font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Home Price */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Home Price
            </label>
            <div className="relative">
              <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                $
              </span>
              <input
                type="number"
                value={inputs.homePrice}
                onChange={(e) => handleInputChange('homePrice', parseFloat(e.target.value) || 0)}
                className={`w-full pl-10 pr-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                  dark 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none transition-colors`}
              />
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Interest Rate
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={inputs.interestRate}
                onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                  dark 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none transition-colors`}
              />
              <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-lg font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                %
              </span>
            </div>
          </div>

          {/* Loan Type */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Loan Type
            </label>
            <select
              value={inputs.loanType}
              onChange={(e) => handleInputChange('loanType', e.target.value)}
              className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                dark 
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none transition-colors appearance-none cursor-pointer`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${dark ? '%23fff' : '%23000'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1.5rem center',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="30">30 Year Fixed</option>
              <option value="20">20 Year Fixed</option>
              <option value="15">15 Year Fixed</option>
              <option value="10">10 Year Fixed</option>
              <option value="5">5/1 ARM</option>
            </select>
          </div>

          {/* Credit Score */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Credit Score
            </label>
            <select
              value={inputs.creditScore}
              onChange={(e) => handleInputChange('creditScore', e.target.value)}
              className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                dark 
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              } focus:outline-none transition-colors appearance-none cursor-pointer`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='${dark ? '%23fff' : '%23000'}'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1.5rem center',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="760-850">760-850 (Excellent)</option>
              <option value="700-759">700-759 (Good)</option>
              <option value="650-699">650-699 (Fair)</option>
              <option value="600-649">600-649 (Poor)</option>
              <option value="below-600">Below 600 (Very Poor)</option>
            </select>
          </div>

          {/* Property Tax */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Property Tax Est.
              </label>
              <div className="relative">
                <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  $
                </span>
                <input
                  type="number"
                  value={inputs.propertyTax}
                  onChange={(e) => handleInputChange('propertyTax', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                    dark 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none transition-colors`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                Percent
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={propertyTaxPercent}
                  onChange={(e) => {
                    const percent = parseFloat(e.target.value) || 0;
                    const newTax = (inputs.homePrice * percent) / 100;
                    handleInputChange('propertyTax', newTax);
                  }}
                  className={`w-full px-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                    dark 
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none transition-colors`}
                />
                <span className={`absolute right-6 top-1/2 -translate-y-1/2 text-lg font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Home Insurance */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Yearly Home Insurance
            </label>
            <div className="relative">
              <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg font-medium ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                $
              </span>
              <input
                type="number"
                value={inputs.homeInsurance}
                onChange={(e) => handleInputChange('homeInsurance', parseFloat(e.target.value) || 0)}
                className={`w-full pl-10 pr-6 py-4 rounded-2xl text-lg font-medium border-2 ${
                  dark 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none transition-colors`}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className={`${dark ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-8 border-2 ${dark ? 'border-gray-700' : 'border-gray-200'} shadow-xl h-fit sticky top-8`}>
          <div className="mb-8">
            <div className={`text-sm font-semibold mb-2 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              Total Monthly Payment
            </div>
            <div className={`text-5xl md:text-6xl font-bold mb-8 ${dark ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(results.monthlyPayment)}
            </div>

            {/* Payment Breakdown Bar */}
            <div className="mb-6">
              <div className="flex h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-600" 
                  style={{ width: `${(results.principalInterest / results.monthlyPayment) * 100}%` }}
                  title="Principal & Interest"
                ></div>
                <div 
                  className="bg-yellow-500" 
                  style={{ width: `${(results.propertyTaxes / results.monthlyPayment) * 100}%` }}
                  title="Property Taxes"
                ></div>
                <div 
                  className="bg-purple-600" 
                  style={{ width: `${(results.insurance / results.monthlyPayment) * 100}%` }}
                  title="Insurance"
                ></div>
              </div>
            </div>

            {/* Breakdown Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-teal-600 rounded-full"></div>
                  <span className={`font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Principal & Interest
                  </span>
                </div>
                <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(results.principalInterest)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className={`font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Property Taxes
                  </span>
                </div>
                <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(results.propertyTaxes)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                  <span className={`font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Insurance
                  </span>
                </div>
                <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(results.insurance)}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className={`border-t-2 ${dark ? 'border-gray-700' : 'border-gray-200'} my-6`}></div>

          {/* Final Total */}
          <div className="flex items-center justify-between">
            <span className={`font-bold text-lg ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
              Total Monthly Payment
            </span>
            <span className={`font-bold text-2xl ${dark ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(results.monthlyPayment)}
            </span>
          </div>

          {/* Additional Info */}
          <div className={`mt-8 p-6 rounded-2xl ${dark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className={dark ? 'text-gray-400' : 'text-gray-600'}>Loan Amount:</span>
                <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(inputs.homePrice - inputs.downPayment)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={dark ? 'text-gray-400' : 'text-gray-600'}>Down Payment:</span>
                <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(inputs.downPayment)} ({results.downPaymentPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className={dark ? 'text-gray-400' : 'text-gray-600'}>Loan Term:</span>
                <span className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                  {inputs.loanType} years
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;