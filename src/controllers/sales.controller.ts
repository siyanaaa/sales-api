import {inject, intercept, Interceptor} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef,
  HttpErrors, param,
  patch, post,
  put,
  Request, requestBody, Response, RestBindings
} from '@loopback/rest';
import {FILE_UPLOAD_SERVICE} from '../keys';
import {Customer} from '../models';
import {CustomerRepository} from '../repositories';
import {FileUploadHandler} from '../types';

const validateCustomer: Interceptor = async (invocationCtx, next) => {
  console.log('log: before-', invocationCtx.methodName);
  const customer: Omit<Customer, 'uuid'> = new Customer();
  if (invocationCtx.methodName === 'create')
      Object.assign(customer, invocationCtx.args[0]);

  if (customer.age >= 99) {
      throw new HttpErrors.InternalServerError('Invalid age');
  }

  const result = await next();
  return result;
};

const parseCsv = (dataArray: string[]) =>  {
  const rows: Customer[] = [];
  for(let i = 1; i < dataArray.length; i++) {
    const data = dataArray[i].split(',');
    const obj: Omit<Customer, 'uuid'> = new Customer();
    obj.user_name = data[0].trim();
    obj.age = parseInt(data[1].trim());
    obj.height = parseInt(data[2].trim());
    obj.gender = data[3].trim();
    obj.sales_amount = parseInt(data[4].trim());
    obj.last_purchase_date = data[5].trim();
    rows.push(obj);
  }
  return rows;
}

interface Files {
  data: Customer[],
}

@intercept(validateCustomer)
export class SalesController {
  constructor(
    @inject(FILE_UPLOAD_SERVICE) private handler: FileUploadHandler,
    @repository(CustomerRepository)
    public customerRepository : CustomerRepository,
  ) {}

  @post('/sales/record', {
    responses: {
      200: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
        description: 'Files and fields',
      },
    },
  })
  async fileUpload(
    @requestBody.file()
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
     ): Promise<object> {
     return new Promise<object>((resolve, reject) => {
       this.handler(request, response, (err: unknown) => {
         if (err) reject(err);
         else {
           const resp = SalesController.getFilesAndFields(request);
           resolve(this.customerRepository.createAll(resp));
         }
       });
     });
  }

  private static getFilesAndFields(request: Request) {
    const uploadedFiles = request.files;
    const mapper = (f: globalThis.Express.Multer.File): Files => ({
      data: parseCsv(f.buffer.toString().trimEnd().split('\n')),
    });
    let files: Files[] = [];
    if (Array.isArray(uploadedFiles)) {
      files = uploadedFiles.map(mapper);
    } else {
      for (const filename in uploadedFiles) {
        files.push(...uploadedFiles[filename].map(mapper));
      }
    }
    return files[0].data;
  }

  @get('/sales/report/{date}', {
    responses: {
      '200': {
        description: 'Customer model instance, filter by Date YYYY-MM-DD',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Customer, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findByDate(
    @param.path.string('date') date: string,
  ): Promise<Customer[]> {
    return this.customerRepository.find({where: {last_purchase_date: {between: [`${date}T00:00:00`,`${date}T23:59:59`]}}} );
  }

  @get('/sales/report/{startDate}/{endDate}', {
    responses: {
      '200': {
        description: 'Customer model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Customer, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findByDateRange(
    @param.path.string('startDate',) startDate: string,
    @param.path.string('endDate') endDate: string,
  ): Promise<Customer[]> {
    return this.customerRepository.find({where: {last_purchase_date: {between: [`${startDate}T00:00:00`,`${endDate}T23:59:59`]}}} );
  }

  @post('/sales/all', {
    responses: {
      '200': {
        description: 'Customer model instance',
        content: {'application/json': {schema: getModelSchemaRef(Customer)}},
      },
    },
  })
  async createAll(
    @requestBody({
      content: {
        'application/json': {
          type: 'array',
          items: getModelSchemaRef(Customer, {
            title: 'NewCustomer',
            exclude: ['uuid'],
          }),
        },
      },
    })
    customer: [Omit<Customer, 'uuid'>],
  ): Promise<Customer[]> {
    return this.customerRepository.createAll(customer)
  }

  @post('/sales', {
    responses: {
      '200': {
        description: 'Customer model instance',
        content: {'application/json': {schema: getModelSchemaRef(Customer)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {
            title: 'NewCustomer',
            exclude: ['uuid'],
          }),
        },
      },
    })
    customer: Omit<Customer, 'uuid'>,
  ): Promise<Customer> {
    return this.customerRepository.create(customer);
  }

  @get('/sales/count', {
    responses: {
      '200': {
        description: 'Customer model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.where(Customer) where?: Where<Customer>,
  ): Promise<Count> {
    return this.customerRepository.count(where);
  }

  @get('/sales', {
    responses: {
      '200': {
        description: 'Array of Customer model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Customer, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Customer) filter?: Filter<Customer>,
  ): Promise<Customer[]> {
    return this.customerRepository.find(filter);
  }

  @patch('/sales', {
    responses: {
      '200': {
        description: 'Customer PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {partial: true}),
        },
      },
    })
    customer: Customer,
    @param.where(Customer) where?: Where<Customer>,
  ): Promise<Count> {
    return this.customerRepository.updateAll(customer, where);
  }

  @get('/sales/{id}', {
    responses: {
      '200': {
        description: 'Customer model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Customer, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Customer, {exclude: 'where'}) filter?: FilterExcludingWhere<Customer>
  ): Promise<Customer> {
    return this.customerRepository.findById(id, filter);
  }

  @patch('/sales/{id}', {
    responses: {
      '204': {
        description: 'Customer PATCH success',
      },
    },
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Customer, {partial: true}),
        },
      },
    })
    customer: Customer,
  ): Promise<void> {
    await this.customerRepository.updateById(id, customer);
  }

  @put('/sales/{id}', {
    responses: {
      '204': {
        description: 'Customer PUT success',
      },
    },
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() customer: Customer,
  ): Promise<void> {
    await this.customerRepository.replaceById(id, customer);
  }

  @del('/sales/{id}', {
    responses: {
      '204': {
        description: 'Customer DELETE success',
      },
    },
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.customerRepository.deleteById(id);
  }
}
