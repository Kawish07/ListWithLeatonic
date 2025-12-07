import { configureStore, createSlice } from '@reduxjs/toolkit';

// Dummy reducer to fix error
const dummySlice = createSlice({
  name: 'dummy',
  initialState: {},
  reducers: {}
});

export default configureStore({
  reducer: {
    dummy: dummySlice.reducer
  },
});
