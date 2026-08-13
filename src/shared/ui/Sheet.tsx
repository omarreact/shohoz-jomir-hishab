import React from "react";

export const Sheet = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const SheetTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  return (
    <div data-bs-toggle="offcanvas" data-bs-target="#mobileMenuOffcanvas">
      {children}
    </div>
  );
};

export const SheetContent = ({ children, side, className, style }: any) => {
  return (
    <div
      className={`offcanvas offcanvas-end ${className || ""}`}
      tabIndex={-1}
      id="mobileMenuOffcanvas"
      style={style}
    >
      {children}
    </div>
  );
};

export const SheetHeader = ({ children, className }: any) => {
  return <div className={`offcanvas-header ${className || ""}`}>{children}</div>;
};

export const SheetTitle = ({ children, className }: any) => {
  return <h5 className={`offcanvas-title ${className || ""}`}>{children}</h5>;
};
