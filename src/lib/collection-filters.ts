import type { ProductRecord } from "@/lib/site-content";

export type CollectionFilterKey = "concern" | "skinType" | "finish" | "timing";

export type CollectionFilterSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type CollectionFilterOption = {
  key: CollectionFilterKey;
  label: string;
  value: string;
  count: number;
  href: string;
  isActive: boolean;
};

export type CollectionFilterGroup = {
  key: CollectionFilterKey;
  label: string;
  options: CollectionFilterOption[];
};

export type ActiveCollectionFilter = {
  key: CollectionFilterKey;
  label: string;
  value: string;
  clearHref: string;
  resultCount: number;
};

export type CollectionFilterState = {
  activeFilters: ActiveCollectionFilter[];
  clearHref: string;
  filteredProducts: ProductRecord[];
  groups: CollectionFilterGroup[];
  isFiltered: boolean;
  totalProducts: number;
};

type FilterConfig = {
  key: CollectionFilterKey;
  label: string;
  getValues: (product: ProductRecord) => string[];
};

const filterConfig: FilterConfig[] = [
  {
    key: "concern",
    label: "المشكلة",
    getValues: (product) => [product.concern],
  },
  {
    key: "skinType",
    label: "نوع البشرة",
    getValues: (product) => product.skinTypes,
  },
  {
    key: "finish",
    label: "النتيجة النهائية",
    getValues: (product) => [product.finish],
  },
  {
    key: "timing",
    label: "وقت الاستخدام",
    getValues: (product) => [product.usageTiming],
  },
];

function getSingleSearchParamValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function buildCollectionHref(
  basePath: string,
  filters: Partial<Record<CollectionFilterKey, string>>,
) {
  const params = new URLSearchParams();

  for (const config of filterConfig) {
    const value = filters[config.key];

    if (!value) {
      continue;
    }

    params.set(config.key, value);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function getActiveFilterValues(searchParams: CollectionFilterSearchParams) {
  return filterConfig.reduce<Partial<Record<CollectionFilterKey, string>>>(
    (accumulator, config) => {
      const value = getSingleSearchParamValue(searchParams[config.key]);

      if (!value) {
        return accumulator;
      }

      accumulator[config.key] = value;
      return accumulator;
    },
    {},
  );
}

function filterProducts(
  collectionProducts: ProductRecord[],
  filters: Partial<Record<CollectionFilterKey, string>>,
) {
  return collectionProducts.filter((product) => {
    if (filters.concern && product.concern !== filters.concern) {
      return false;
    }

    if (
      filters.skinType &&
      !product.skinTypes.includes(filters.skinType)
    ) {
      return false;
    }

    if (filters.finish && product.finish !== filters.finish) {
      return false;
    }

    if (filters.timing && product.usageTiming !== filters.timing) {
      return false;
    }

    return true;
  });
}

function getUniqueOptionValues(
  collectionProducts: ProductRecord[],
  getValues: FilterConfig["getValues"],
) {
  return Array.from(
    new Set(collectionProducts.flatMap((product) => getValues(product))),
  ).sort((left, right) => left.localeCompare(right, "ar"));
}

export function getCollectionFilterState(
  basePath: string,
  collectionProducts: ProductRecord[],
  searchParams: CollectionFilterSearchParams,
): CollectionFilterState {
  const activeValues = getActiveFilterValues(searchParams);
  const filteredProducts = filterProducts(collectionProducts, activeValues);

  const activeFilters = filterConfig.flatMap<ActiveCollectionFilter>((config) => {
    const value = activeValues[config.key];

    if (!value) {
      return [];
    }

    const nextFilters = { ...activeValues };
    delete nextFilters[config.key];

    return [
      {
        key: config.key,
        label: config.label,
        value,
        clearHref: buildCollectionHref(basePath, nextFilters),
        resultCount: filterProducts(collectionProducts, nextFilters).length,
      },
    ];
  });

  const groups = filterConfig.map<CollectionFilterGroup>((config) => {
    const optionValues = getUniqueOptionValues(collectionProducts, config.getValues);

    return {
      key: config.key,
      label: config.label,
      options: optionValues.map((value) => {
        const isActive = activeValues[config.key] === value;
        const nextFilters = { ...activeValues };
        const countFilters = { ...activeValues };

        if (isActive) {
          delete nextFilters[config.key];
        } else {
          nextFilters[config.key] = value;
          countFilters[config.key] = value;
        }

        return {
          key: config.key,
          label: value,
          value,
          count: filterProducts(collectionProducts, countFilters).length,
          href: buildCollectionHref(basePath, nextFilters),
          isActive,
        };
      }),
    };
  });

  return {
    activeFilters,
    clearHref: basePath,
    filteredProducts,
    groups,
    isFiltered: activeFilters.length > 0,
    totalProducts: collectionProducts.length,
  };
}

export function hasActiveCollectionFilters(
  searchParams: CollectionFilterSearchParams,
) {
  return filterConfig.some((config) =>
    Boolean(getSingleSearchParamValue(searchParams[config.key])),
  );
}
