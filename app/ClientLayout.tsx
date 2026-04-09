"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { store } from "../store";
import { Toaster } from "react-hot-toast";
import Header from "@components/Header/Header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body className="antialiased bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <Provider store={store}>
        
          <Toaster 
            position="bottom-right" 
            reverseOrder={false} 
            containerStyle={{ zIndex: 99999 }}
          />
          <Header  />
          <main className="px-3 sm:px-6 lg:px-10 pb-6 sm:pb-8 lg:pb-10">
            {children}
          </main>
        
      </Provider>
    </body>
  );
}
