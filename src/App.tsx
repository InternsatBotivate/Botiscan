import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Phone, Mail, MapPin, Globe, Download, QrCode, User, Building2, Briefcase, Image, X } from "lucide-react"
import jsPDF from "jspdf"
// @ts-expect-error - QRCode library doesn't have TypeScript definitions
import QRCodeLib from "qrcode"

interface FormData {
  personName: string
  companyName: string
  designation: string
  phoneNo: string
  email: string
  anyLink: string
  address: string
  logo: string
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    personName: "",
    companyName: "",
    designation: "",
    phoneNo: "",
    email: "",
    anyLink: "",
    address: "",
    logo: "",
  })

  const [qrCodeGenerated, setQrCodeGenerated] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        setFormData(prev => ({
          ...prev,
          logo: result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoPreview("")
    setFormData(prev => ({
      ...prev,
      logo: ""
    }))
  }

  const generateVCard = (data: FormData): string => {
    const nameParts = data.personName.split(' ')
    const lastName = nameParts.length > 1 ? nameParts.pop() : ''
    const firstName = nameParts.join(' ') || data.personName

    return `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${data.personName}
ORG:${data.companyName}
TITLE:${data.designation}
TEL:${data.phoneNo}
EMAIL:${data.email}
ADR:;;${data.address};;;;
URL:${data.anyLink}
END:VCARD`.trim()
  }

  const generateQRCodeDataURL = async (text: string): Promise<string> => {
    try {
      const qrOptions = {
        errorCorrectionLevel: "H",
        type: "image/png" as const,
        quality: 0.95,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 600,
      }

      const dataURL = await QRCodeLib.toDataURL(text, qrOptions)
      return dataURL
    } catch (error) {
      console.error("QR Code generation failed:", error)
      throw error
    }
  }

  const handleSave = () => {
    if (!formData.personName || !formData.companyName || !formData.phoneNo || !formData.email) {
      alert("Please fill in all required fields: Person Name, Company Name, Phone No, and Email")
      return
    }
    setQrCodeGenerated(true)
  }

  const handleCancel = () => {
    setFormData({
      personName: "",
      companyName: "",
      designation: "",
      phoneNo: "",
      email: "",
      anyLink: "",
      address: "",
      logo: "",
    })
    setLogoPreview("")
    setQrCodeGenerated(false)
  }

  const downloadContactPDF = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // White background
      pdf.setFillColor(255, 255, 255)
      pdf.rect(0, 0, pageWidth, pageHeight, "F")

      try {
        const vCardData = generateVCard(formData)
        const contactQRDataURL = await generateQRCodeDataURL(vCardData)

        // QR Code positioning - centered on page
        const qrSize = 150
        const qrX = (pageWidth - qrSize) / 2
        const qrY = (pageHeight - qrSize) / 2 - 10

        // Add white padding around QR code
        pdf.setFillColor(255, 255, 255)
        const padding = 10
        pdf.roundedRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2), 5, 5, "F")

        // Add subtle shadow
        pdf.setFillColor(240, 240, 240)
        pdf.roundedRect(qrX - padding + 1, qrY - padding + 1, qrSize + (padding * 2), qrSize + (padding * 2), 5, 5, "F")
        
        // Add white box on top
        pdf.setFillColor(255, 255, 255)
        pdf.roundedRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2), 5, 5, "F")

        // Add border
        pdf.setDrawColor(220, 220, 220)
        pdf.setLineWidth(0.5)
        pdf.roundedRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2), 5, 5, "S")

        // Add QR code
        pdf.addImage(contactQRDataURL, "PNG", qrX, qrY, qrSize, qrSize)

        // Add logo in center of QR code with proper fitting
        if (formData.logo) {
          try {
            // Logo should be approximately 20-25% of QR code size for optimal scanning
            const logoSize = qrSize * 0.22  // 22% of QR code size
            const logoX = qrX + (qrSize - logoSize) / 2
            const logoY = qrY + (qrSize - logoSize) / 2

            // White rounded square background for logo with padding
            const bgSize = logoSize + 8
            const bgX = qrX + (qrSize - bgSize) / 2
            const bgY = qrY + (qrSize - bgSize) / 2
            
            pdf.setFillColor(255, 255, 255)
            pdf.roundedRect(bgX, bgY, bgSize, bgSize, 3, 3, "F")

            // Add subtle border around logo background
            pdf.setDrawColor(200, 200, 200)
            pdf.setLineWidth(0.2)
            pdf.roundedRect(bgX, bgY, bgSize, bgSize, 3, 3, "S")

            // Add logo centered
            pdf.addImage(formData.logo, "PNG", logoX, logoY, logoSize, logoSize)
          } catch (error) {
            console.error("Logo error:", error)
          }
        }

        // Footer at bottom
        const footerY = pageHeight - 15
        
        pdf.setTextColor(120, 120, 120)
        pdf.setFontSize(10)
        pdf.setFont("helvetica", "normal")
        pdf.text("Powered by Botivate.in", pageWidth / 2, footerY, { align: "center" })
        
        pdf.setTextColor(79, 70, 229)
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "normal")
        pdf.text("www.botivate.in", pageWidth / 2, footerY + 5, { align: "center" })

      } catch (error) {
        console.error("QR code generation failed:", error)
      }

      pdf.save(`${formData.personName.replace(/\s+/g, '-')}-Contact-QR.pdf`)

      setTimeout(() => {
        handleCancel()
      }, 500)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("There was an error generating the PDF. Please try again.")
    }
  }

  const vCardData = qrCodeGenerated ? generateVCard(formData) : ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8 bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border-2 border-indigo-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10"></div>
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 tracking-tight">
              Botiscan
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">Generate Professional QR Codes for Contact Information</p>
          </div>
        </div>

        {!qrCodeGenerated ? (
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border-2 border-indigo-100">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 sm:mb-8 text-center">
              Contact Information
            </h2>

            <div className="space-y-5 sm:space-y-6">
              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <User className="h-5 w-5 mr-2 text-indigo-600" />
                  Person Name *
                </label>
                <input
                  type="text"
                  name="personName"
                  value={formData.personName}
                  onChange={handleInputChange}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-indigo-200"
                  placeholder="Enter person name"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-indigo-200"
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-indigo-200"
                  placeholder="Enter designation"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <Phone className="h-5 w-5 mr-2 text-indigo-600" />
                  Phone No *
                </label>
                <input
                  type="tel"
                  name="phoneNo"
                  value={formData.phoneNo}
                  onChange={handleInputChange}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-indigo-200"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <Mail className="h-5 w-5 mr-2 text-indigo-600" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-indigo-200"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                  Any Link
                </label>
                <input
                  type="url"
                  name="anyLink"
                  value={formData.anyLink}
                  onChange={handleInputChange}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-indigo-200"
                  placeholder="Enter website or social media link"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 hover:border-indigo-200 resize-none"
                  placeholder="Enter address"
                  rows={3}
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-bold text-gray-800 mb-2">
                  <Image className="h-5 w-5 mr-2 text-indigo-600" />
                  Logo
                </label>

                {!logoPreview ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center justify-center w-full px-4 py-8 sm:py-10 border-3 border-dashed border-indigo-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"
                    >
                      <div className="text-center">
                        <Image className="h-12 sm:h-14 w-12 sm:w-14 text-indigo-400 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-700">Click to upload logo</p>
                        <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-32 sm:h-36 w-32 sm:w-36 object-contain border-3 border-indigo-200 rounded-xl p-2 bg-white shadow-lg"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 sm:mt-10">
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-200 text-base sm:text-lg"
              >
                Generate QR Code
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-base sm:text-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-indigo-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white text-center p-6 sm:p-8">
              <h2 className="flex items-center justify-center gap-3 text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">
                <QrCode className="h-8 sm:h-10 w-8 sm:w-10" />
                Your QR Code is Ready!
              </h2>
              <p className="text-indigo-100 text-base sm:text-lg">Scan to save contact information instantly</p>
            </div>

            <div className="p-6 sm:p-8 lg:p-10 text-center">
              <div className="flex justify-center mb-8 sm:mb-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-40 animate-pulse"></div>
                  <div className="relative bg-white p-6 sm:p-8 lg:p-10 rounded-3xl shadow-2xl border-4 border-indigo-100">
                    <QRCodeSVG
                      value={vCardData}
                      size={280}
                      level="H"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#ffffff"
                      imageSettings={formData.logo ? {
                        src: formData.logo,
                        height: 60,
                        width: 60,
                        excavate: true,
                      } : undefined}
                      className="sm:w-80 sm:h-80"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 sm:p-8 rounded-2xl border-2 border-indigo-100 mb-6 sm:mb-8 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">{formData.personName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
                  <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                    <Building2 className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700 font-medium">{formData.companyName}</span>
                  </div>
                  {formData.designation && (
                    <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                      <Briefcase className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700 font-medium">{formData.designation}</span>
                    </div>
                  )}
                  <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                    <Phone className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700 font-medium">{formData.phoneNo}</span>
                  </div>
                  <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                    <Mail className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                    <span className="text-sm sm:text-base text-gray-700 font-medium break-all">{formData.email}</span>
                  </div>
                  {formData.anyLink && (
                    <div className="flex items-center sm:col-span-2 bg-white p-3 rounded-lg shadow-sm">
                      <Globe className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-gray-700 font-medium break-all">{formData.anyLink}</span>
                    </div>
                  )}
                  {formData.address && (
                    <div className="flex items-start sm:col-span-2 bg-white p-3 rounded-lg shadow-sm">
                      <MapPin className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0 mt-1" />
                      <span className="text-sm sm:text-base text-gray-700 font-medium">{formData.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={downloadContactPDF}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold py-4 sm:py-5 px-10 sm:px-14 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200 text-base sm:text-lg"
              >
                <Download className="inline-block h-5 sm:h-6 w-5 sm:w-6 mr-2 sm:mr-3" />
                Download QR Code PDF
              </button>
            </div>
          </div>
        )}

        <footer className="mt-8 text-center py-5 sm:py-6 bg-white rounded-2xl shadow-xl border-2 border-indigo-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50"></div>
          <div className="relative">
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              Powered by{" "}
              <a
                href="https://www.botivate.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
              >
                Botivate.in
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App