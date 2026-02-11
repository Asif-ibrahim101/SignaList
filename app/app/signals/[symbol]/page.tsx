import StockDetailDashboard from '@/components/StockDetailDashboard';

type PageProps = {
  params: Promise<{ symbol: string }>;
};

const SignalDetailPage = async ({ params }: PageProps) => {
  const { symbol } = await params;

  return <StockDetailDashboard symbol={symbol} />;
};

export default SignalDetailPage;
