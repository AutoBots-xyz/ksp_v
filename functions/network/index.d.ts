export default function network(ctx: any): Promise<{
    meta?: Record<string, unknown> | undefined;
    success: true;
    data: {
        elements: {
            nodes: any[];
            edges: {
                data: {
                    id: any;
                    source: any;
                    target: any;
                    label: any;
                };
            }[];
        };
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
