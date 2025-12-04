declare module "react-select-country-list" {
  type CountryOption = {
    label: string
    value: string
  }

  type CountryListInstance = {
    getData: () => CountryOption[]
  }

  export default function countryList(): CountryListInstance
}

