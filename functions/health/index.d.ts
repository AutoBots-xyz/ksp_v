export default function health(_ctx: unknown): Promise<{
    meta?: Record<string, unknown> | undefined;
    success: true;
    data: {
        status: string;
        env: import("../common/config").AppEnv;
    };
}>;
