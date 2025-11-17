# data-layout
Pattern of bytes to store on media for numeric arrays.

The idea is to hold data in buffer in such a layout that its most efficient to retrieve and write, plus majorly it should be future proof.

Some points on which the thought process if based:
1. Prefer Encoding over Compression.
2. Use finite file size.

Encoding Types:
1. Lossy:
    1. Prometeus Up/Down counter:
        Stores Histogram, Sum, Count of events, which benefits it from isolation of collection frequency.
        Uses rate(metric,[5m]) function to interpolate data for given time period to reconstruct a value.
        Good for static values, Bad for describing waveforms.

2. LossLess:
    1. FOR: Frame of reference.
        This is basically delta encoding which reduces the datatype with half of its need eg 64bit can be saved in 32bit by subtracting a base value from each value, and SIMD can be used to reconstruct the data.
    2. Dictionary:
    3. RLE: Run Length Encoding.
    

