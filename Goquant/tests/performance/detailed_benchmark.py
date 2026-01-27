"""Detailed performance benchmarks for matching engine components."""

import time
import asyncio
from decimal import Decimal
from datetime import datetime
from statistics import mean, stdev, median
from collections import defaultdict

from matching_engine.core.engine import MatchingEngine
from matching_engine.core.models import Order, OrderType, Side
from matching_engine.core.order_book import OrderBook
from matching_engine.publishers.market_data import MarketDataPublisher
from matching_engine.publishers.trade import TradePublisher


def create_order(order_id, order_type, side, quantity, price=None):
    """Helper to create orders."""
    return Order(
        order_id=order_id,
        symbol="BTC-USDT",
        order_type=order_type,
        side=side,
        quantity=Decimal(str(quantity)),
        price=Decimal(str(price)) if price else None,
        timestamp=datetime.utcnow(),
        remaining_quantity=Decimal(str(quantity))
    )


class DetailedBenchmark:
    """Detailed performance benchmarking suite."""
    
    def __init__(self):
        self.results = defaultdict(list)
    
    def benchmark_order_processing_latency(self, num_orders=10000):
        """
        Detailed order processing latency benchmark.
        
        Measures:
        - Average latency
        - P50, P95, P99, P99.9 percentiles
        - Min/Max latency
        """
        print(f"\n{'='*70}")
        print(f"ORDER PROCESSING LATENCY BENCHMARK ({num_orders} orders)")
        print('='*70)
        
        engine = MatchingEngine()
        latencies = []
        
        # Pre-populate order book
        for i in range(100):
            sell = create_order(f"SELL-{i}", OrderType.LIMIT, Side.SELL, 1.0, 50000 + i)
            engine.process_order(sell)
        
        # Benchmark different order types
        order_types = [
            (OrderType.LIMIT, "Limit Orders"),
            (OrderType.MARKET, "Market Orders"),
            (OrderType.IOC, "IOC Orders"),
        ]
        
        for order_type, label in order_types:
            latencies = []
            
            for i in range(num_orders):
                if order_type == OrderType.MARKET:
                    order = create_order(f"BUY-{i}", order_type, Side.BUY, 0.1)
                else:
                    order = create_order(f"BUY-{i}", order_type, Side.BUY, 0.1, 49000 + (i % 100))
                
                start = time.perf_counter()
                engine.process_order(order)
                end = time.perf_counter()
                
                latencies.append((end - start) * 1000000)  # Convert to microseconds
            
            # Calculate statistics
            latencies.sort()
            avg = mean(latencies)
            med = median(latencies)
            std = stdev(latencies)
            p50 = latencies[int(len(latencies) * 0.50)]
            p95 = latencies[int(len(latencies) * 0.95)]
            p99 = latencies[int(len(latencies) * 0.99)]
            p999 = latencies[int(len(latencies) * 0.999)]
            min_lat = min(latencies)
            max_lat = max(latencies)
            
            print(f"\n{label}:")
            print(f"  Average:    {avg:8.2f} μs")
            print(f"  Median:     {med:8.2f} μs")
            print(f"  Std Dev:    {std:8.2f} μs")
            print(f"  P50:        {p50:8.2f} μs")
            print(f"  P95:        {p95:8.2f} μs")
            print(f"  P99:        {p99:8.2f} μs")
            print(f"  P99.9:      {p999:8.2f} μs")
            print(f"  Min:        {min_lat:8.2f} μs")
            print(f"  Max:        {max_lat:8.2f} μs")
            
            self.results[f"{label}_avg"] = avg
            self.results[f"{label}_p99"] = p99
    
    def benchmark_bbo_update_latency(self, num_updates=10000):
        """
        BBO calculation and update latency benchmark.
        
        Measures time to calculate BBO after order book changes.
        """
        print(f"\n{'='*70}")
        print(f"BBO UPDATE LATENCY BENCHMARK ({num_updates} updates)")
        print('='*70)
        
        order_book = OrderBook("BTC-USDT")
        latencies = []
        
        # Add initial orders
        for i in range(100):
            buy = create_order(f"BUY-{i}", OrderType.LIMIT, Side.BUY, 1.0, 50000 - i)
            order_book.add_order(buy)
            
            sell = create_order(f"SELL-{i}", OrderType.LIMIT, Side.SELL, 1.0, 50100 + i)
            order_book.add_order(sell)
        
        # Benchmark BBO calculation
        for i in range(num_updates):
            start = time.perf_counter()
            bbo = order_book.calculate_bbo()
            end = time.perf_counter()
            
            latencies.append((end - start) * 1000000)  # microseconds
        
        # Statistics
        latencies.sort()
        avg = mean(latencies)
        p99 = latencies[int(len(latencies) * 0.99)]
        
        print(f"\nBBO Calculation:")
        print(f"  Average:    {avg:8.2f} μs")
        print(f"  P99:        {p99:8.2f} μs")
        print(f"  Min:        {min(latencies):8.2f} μs")
        print(f"  Max:        {max(latencies):8.2f} μs")
        
        self.results["BBO_avg"] = avg
        self.results["BBO_p99"] = p99
    
    def benchmark_trade_generation_latency(self, num_trades=10000):
        """
        Trade generation and dissemination latency benchmark.
        """
        print(f"\n{'='*70}")
        print(f"TRADE GENERATION LATENCY BENCHMARK ({num_trades} trades)")
        print('='*70)
        
        engine = MatchingEngine()
        latencies = []
        
        # Add sell orders
        for i in range(num_trades):
            sell = create_order(f"SELL-{i}", OrderType.LIMIT, Side.SELL, 0.1, 50000)
            engine.process_order(sell)
        
        # Benchmark trade generation
        for i in range(num_trades):
            buy = create_order(f"BUY-{i}", OrderType.MARKET, Side.BUY, 0.1)
            
            start = time.perf_counter()
            result = engine.process_order(buy)
            end = time.perf_counter()
            
            if result.trades:
                latencies.append((end - start) * 1000000)
        
        # Statistics
        latencies.sort()
        avg = mean(latencies)
        p99 = latencies[int(len(latencies) * 0.99)]
        
        print(f"\nTrade Generation:")
        print(f"  Average:    {avg:8.2f} μs")
        print(f"  P99:        {p99:8.2f} μs")
        print(f"  Min:        {min(latencies):8.2f} μs")
        print(f"  Max:        {max(latencies):8.2f} μs")
        
        self.results["Trade_avg"] = avg
        self.results["Trade_p99"] = p99
    
    def benchmark_throughput_under_load(self, duration=10):
        """
        Throughput benchmark under sustained load.
        """
        print(f"\n{'='*70}")
        print(f"THROUGHPUT UNDER LOAD ({duration}s)")
        print('='*70)
        
        engine = MatchingEngine()
        order_count = 0
        start_time = time.time()
        end_time = start_time + duration
        
        while time.time() < end_time:
            order = create_order(
                f"ORD-{order_count}",
                OrderType.LIMIT,
                Side.BUY if order_count % 2 == 0 else Side.SELL,
                1.0,
                50000 + (order_count % 100)
            )
            engine.process_order(order)
            order_count += 1
        
        actual_duration = time.time() - start_time
        throughput = order_count / actual_duration
        
        print(f"\nThroughput:")
        print(f"  Orders:     {order_count:,}")
        print(f"  Duration:   {actual_duration:.2f}s")
        print(f"  Rate:       {throughput:,.0f} orders/sec")
        
        self.results["Throughput"] = throughput
    
    def benchmark_order_book_depth_performance(self):
        """
        Benchmark order book depth retrieval performance.
        """
        print(f"\n{'='*70}")
        print("ORDER BOOK DEPTH PERFORMANCE")
        print('='*70)
        
        order_book = OrderBook("BTC-USDT")
        
        # Add many price levels
        for i in range(1000):
            buy = create_order(f"BUY-{i}", OrderType.LIMIT, Side.BUY, 1.0, 50000 - i)
            order_book.add_order(buy)
            
            sell = create_order(f"SELL-{i}", OrderType.LIMIT, Side.SELL, 1.0, 50100 + i)
            order_book.add_order(sell)
        
        # Benchmark depth retrieval
        depths = [10, 50, 100]
        
        for depth in depths:
            latencies = []
            
            for _ in range(1000):
                start = time.perf_counter()
                bids, asks = order_book.get_depth(depth)
                end = time.perf_counter()
                
                latencies.append((end - start) * 1000000)
            
            avg = mean(latencies)
            print(f"\nDepth {depth} levels:")
            print(f"  Average:    {avg:8.2f} μs")
    
    def benchmark_memory_efficiency(self):
        """
        Benchmark memory usage under different loads.
        """
        print(f"\n{'='*70}")
        print("MEMORY EFFICIENCY")
        print('='*70)
        
        import sys
        
        engine = MatchingEngine()
        
        # Measure base size
        base_size = sys.getsizeof(engine)
        
        # Add orders and measure
        order_counts = [100, 1000, 10000]
        
        for count in order_counts:
            engine = MatchingEngine()
            
            for i in range(count):
                buy = create_order(f"BUY-{i}", OrderType.LIMIT, Side.BUY, 1.0, 50000 - (i % 100))
                engine.process_order(buy)
            
            # Rough memory estimate
            order_book = engine.order_books.get("BTC-USDT")
            if order_book:
                print(f"\n{count} orders:")
                print(f"  Price levels: {len(order_book.bids)}")
                print(f"  Orders in index: {len(order_book.order_index)}")
    
    def run_all_benchmarks(self):
        """Run complete benchmark suite."""
        print("\n" + "="*70)
        print("DETAILED PERFORMANCE BENCHMARK SUITE")
        print("="*70)
        
        self.benchmark_order_processing_latency(10000)
        self.benchmark_bbo_update_latency(10000)
        self.benchmark_trade_generation_latency(5000)
        self.benchmark_throughput_under_load(10)
        self.benchmark_order_book_depth_performance()
        self.benchmark_memory_efficiency()
        
        # Summary
        print(f"\n{'='*70}")
        print("PERFORMANCE SUMMARY")
        print('='*70)
        print(f"\nOrder Processing:")
        print(f"  Limit Orders:   {self.results.get('Limit Orders_avg', 0):8.2f} μs avg, {self.results.get('Limit Orders_p99', 0):8.2f} μs p99")
        print(f"  Market Orders:  {self.results.get('Market Orders_avg', 0):8.2f} μs avg, {self.results.get('Market Orders_p99', 0):8.2f} μs p99")
        print(f"\nBBO Updates:      {self.results.get('BBO_avg', 0):8.2f} μs avg, {self.results.get('BBO_p99', 0):8.2f} μs p99")
        print(f"Trade Generation: {self.results.get('Trade_avg', 0):8.2f} μs avg, {self.results.get('Trade_p99', 0):8.2f} μs p99")
        print(f"\nThroughput:       {self.results.get('Throughput', 0):,.0f} orders/sec")
        print("\n" + "="*70)


if __name__ == "__main__":
    benchmark = DetailedBenchmark()
    benchmark.run_all_benchmarks()
