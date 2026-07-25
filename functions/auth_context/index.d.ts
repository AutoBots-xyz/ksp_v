export default function me(ctx: unknown): Promise<{
    meta?: Record<string, unknown> | undefined;
    success: true;
    data: {
        userProfileId: number;
        role: "SUPER_ADMIN" | "SCRB_ANALYST" | "DISTRICT_COMMAND" | "SHO" | "IO" | "DATA_OPERATOR" | "AUDITOR" | "VIEWER";
        districtId: number | null;
        unitId: number | null;
        employeeId: number | null;
        permissions: {
            canSeePii: boolean;
            canExport: boolean;
            isAdmin: boolean;
            canReadAudit: boolean;
            isStateScope: boolean;
        };
        home: string;
        scope: import("../common").Scope;
    };
} | {
    status: number;
    body: {
        success: false;
        error: {
            code: import("../common/errors").ErrorCode;
            message: string;
            requestId: string | undefined;
        };
    };
}>;
