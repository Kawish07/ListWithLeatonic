import React from 'react';
import useConfirmStore from '../store/confirmStore';

const ConfirmContainer = () => {
  const { isOpen, message, confirm, cancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60" onClick={cancel}></div>
      <div className="relative bg-white dark:bg-[#0b1220] text-black dark:text-white w-full max-w-md p-6 rounded-lg shadow-2xl z-10">
        <h4 className="text-lg font-semibold mb-2">Confirm</h4>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={cancel}>Cancel</button>
          <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={confirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmContainer;
