import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ExampleState {
  value: string;
}

const initialState: ExampleState = {
  value: "",
};

const exampleSlice = createSlice({
  name: "example",
  initialState,
  reducers: {
    // increment: (state) => {
    //   state.value += 1;
    // },
    setValue: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
    reset: () => initialState,
  },
});

export const {setValue, reset } =
  exampleSlice.actions;

export default exampleSlice.reducer;
