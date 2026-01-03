import SwiftUI

extension Color {
    static let bg = Color(hex: 0x0E1116)
    static let surface = Color(hex: 0x141821)
    static let text = Color(hex: 0xE6E8EA)
    static let muted = Color(hex: 0x98A2B3)
    static let primaryBrand = Color(hex: 0x6E78FF)
    static let success = Color(hex: 0x22C55E)
    static let danger = Color(hex: 0xEF4444)
    static let warning = Color(hex: 0xF59E0B)
    
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xff) / 255,
            green: Double((hex >> 08) & 0xff) / 255,
            blue: Double((hex >> 00) & 0xff) / 255,
            opacity: alpha
        )
    }
}
