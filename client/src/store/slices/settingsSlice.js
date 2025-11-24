import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { ENDPOINTS } from "../../config/api";

export const fetchSettings = createAsyncThunk(
  "settings/fetchSettings",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${auth.user.token}`,
        },
      };
      const { data } = await axios.get(ENDPOINTS.SETTINGS, config);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    data: null,
    loading: false,
    error: null,
    loaded: false, // To track if we've already fetched
  },
  reducers: {
    clearSettings: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.loaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.loaded = true;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
