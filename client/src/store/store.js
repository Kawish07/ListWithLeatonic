import { configureStore, createSlice } from '@reduxjs/toolkit';

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
