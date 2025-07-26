
import ProtectedRoleWrapper from "@/components/auth/ProtectedRoleWrapper";
import { ReactNode } from "react";

interface ConciergeLayoutProps {
    children: ReactNode;
}

export default function ConciergeLayout({ children }: ConciergeLayoutProps) {
    return (
        <ProtectedRoleWrapper>
            {children}
        </ProtectedRoleWrapper>
    );
}
